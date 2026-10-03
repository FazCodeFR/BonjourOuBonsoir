import { etatActuel, memeHeureQueParis } from '../../salutation.js';
import { getSoleil, positionVisiteur, PARIS } from './soleil.js';

function detail(soleil, lieu, lang) {
  return {
    ...etatActuel(soleil.lever, soleil.coucher, lang, new Date(), lieu.fuseau),
    ville: lieu.ville,
    fuseau: lieu.fuseau,
    date: soleil.date,
    leverDecimal: Number(soleil.lever.toFixed(4)),
    coucherDecimal: Number(soleil.coucher.toFixed(4)),
  };
}

// Réponse pour la France et, si le visiteur n'a pas l'heure française, pour chez lui.
// { france: {...}, local: {...} | null, memeHeureQueLaFrance: bool }
export async function construireReponse(request, { params, lang = 'fr', avecLocal = true } = {}) {
  const lieu = avecLocal ? positionVisiteur(request, params) : null;
  const local = lieu && !memeHeureQueParis(lieu.fuseau) ? lieu : null;

  const [soleilFrance, soleilLocal] = await Promise.all([
    getSoleil(PARIS),
    local ? getSoleil(local) : null,
  ]);

  return {
    france: detail(soleilFrance, PARIS, lang),
    local: local ? detail(soleilLocal, local, lang) : null,
    memeHeureQueLaFrance: !local,
  };
}
