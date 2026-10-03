import { construireReponse } from '../_lib/reponse.js';

// GET /api/bonjour-ou-bonsoir?lang=fr|en[&tz=America/Toronto&lat=43.65&lng=-79.38]
// -> { "france": { "reponse": "Bonsoir", "heure": "18h12", "bascule": "17h41", ... },
//      "local": { ... } | null, "memeHeureQueLaFrance": true, "source": "https://bonjouroubonsoir.fr/" }
// Sans paramètres, la position "local" est déduite de l'IP (approximative).
export async function onRequestGet({ request }) {
  const params = new URL(request.url).searchParams;
  const lang = params.get('lang') === 'en' ? 'en' : 'fr';
  const reponse = await construireReponse(request, { params, lang });

  return new Response(JSON.stringify({
    ...reponse,
    source: 'https://bonjouroubonsoir.fr/',
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      // "private" : la partie "local" dépend de la position du visiteur, pas de cache partagé
      'Cache-Control': 'private, max-age=60',
    },
  });
}
