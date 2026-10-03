import { construireReponse } from './_lib/reponse.js';

// Pages où la réponse est calculée côté serveur (pas de flash, robots et no-JS servis).
const PAGES = { '/': 'fr', '/en/': 'en' };
// Les robots ne reçoivent que la réponse France (pas de "Chez vous (Mountain View)" dans les extraits)
const ROBOT = /bot|crawl|spider|slurp|preview|lighthouse/i;

function texte(selecteur, valeur) {
  return [selecteur, { element(el) { el.setInnerContent(valeur); } }];
}

export async function onRequest(context) {
  const { request } = context;
  const lang = PAGES[new URL(request.url).pathname];
  if (request.method !== 'GET' || !lang) {
    return context.next();
  }

  const avecLocal = !ROBOT.test(request.headers.get('User-Agent') || '');
  const [response, { france, local }] = await Promise.all([
    context.next(),
    construireReponse(request, { lang, avecLocal }),
  ]);
  if (response.status !== 200 || !(response.headers.get('Content-Type') || '').includes('text/html')) {
    return response;
  }

  let rendu = new HTMLRewriter()
    .on('#bonText', {
      element(el) {
        el.setInnerContent(france.reponse);
        el.setAttribute('data-lever', String(france.leverDecimal));
        el.setAttribute('data-coucher', String(france.coucherDecimal));
        el.setAttribute('data-date', france.date);
      },
    })
    .on(...texte('#switchTime', france.bascule));

  if (local) {
    rendu = rendu
      .on('#local', {
        element(el) {
          el.removeAttribute('hidden');
          el.setAttribute('data-lever', String(local.leverDecimal));
          el.setAttribute('data-coucher', String(local.coucherDecimal));
          el.setAttribute('data-fuseau', local.fuseau);
          el.setAttribute('data-date', local.date);
        },
      })
      .on(...texte('#localVille', local.ville))
      .on(...texte('#localHeure', local.heure))
      .on(...texte('#localText', local.reponse))
      .on(...texte('#localSwitch', local.bascule));
  }

  const transforme = rendu.transform(response);
  const headers = new Headers(transforme.headers);
  // Le mot change dans la journée et selon le visiteur : jamais de version figée en cache
  headers.set('Cache-Control', 'private, no-cache');
  return new Response(transforme.body, { status: transforme.status, headers });
}
