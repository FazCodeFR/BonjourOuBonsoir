import { etatActuel, heureDans, memeHeureQueParis, decalage, FUSEAU_FRANCE, SEUIL_MATIN_DEFAUT, SEUIL_BONSOIR_DEFAUT } from './salutation.js';

const lang = document.documentElement.lang;
// La page est sous /en/ : l'API est à la racine du site
const API = new URL('/api/bonjour-ou-bonsoir', location.href);
API.searchParams.set('lang', lang);

const $ = id => document.getElementById(id);
const bonText = $('bonText');
const blocLocal = $('local');

// Fuseau du navigateur (le serveur, lui, ne connaît que la position de l'IP)
let fuseauNav = FUSEAU_FRANCE;
try {
  fuseauNav = Intl.DateTimeFormat().resolvedOptions().timeZone || FUSEAU_FRANCE;
} catch (e) { /* navigateur ancien : France uniquement */ }
const afficherLocal = !memeHeureQueParis(fuseauNav);

// Lever/coucher du jour (heures décimales), injectés dans le HTML par la Cloudflare Function.
function lireSoleil(el) {
  return {
    lever: parseFloat(el.dataset.lever),
    coucher: parseFloat(el.dataset.coucher),
    date: el.dataset.date,
    fuseau: el.dataset.fuseau || FUSEAU_FRANCE,
  };
}
const soleil = {
  france: lireSoleil(bonText),
  local: blocLocal.hidden ? null : lireSoleil(blocLocal),
};

// N'écrit que si la valeur change : pas de mutation inutile du DOM
function ecrire(el, valeur) {
  if (el.textContent !== valeur) el.textContent = valeur;
}

function valide(s, fuseau) {
  return s && !Number.isNaN(s.lever) && !Number.isNaN(s.coucher) && s.date === heureDans(fuseau).date;
}

function afficher() {
  const f = soleil.france;
  const france = etatActuel(f.lever, f.coucher, lang, new Date(), FUSEAU_FRANCE);
  ecrire(bonText, france.reponse);
  ecrire($('switchTime'), france.bascule);

  const l = soleil.local;
  if (afficherLocal && l) {
    const local = etatActuel(l.lever, l.coucher, lang, new Date(), l.fuseau);
    if (l.ville) ecrire($('localVille'), l.ville);
    ecrire($('localHeure'), local.heure);
    ecrire($('localText'), local.reponse);
    ecrire($('localSwitch'), local.bascule);
  }
  blocLocal.hidden = !(afficherLocal && l);
}

// Recharge les données du jour auprès de notre API (page hors ligne, changement de jour, VPN…).
async function chargerDonnees() {
  try {
    const url = new URL(API);
    if (afficherLocal) url.searchParams.set('tz', fuseauNav);
    const data = await (await fetch(url)).json();
    const versSoleil = d => ({ lever: d.leverDecimal, coucher: d.coucherDecimal, date: d.date, fuseau: d.fuseau, ville: d.ville });
    soleil.france = versSoleil(data.france);
    soleil.local = data.local ? versSoleil(data.local) : null;
  } catch (e) {
    // En cas d'échec, on garde les valeurs déjà connues, ou 6h / 18h par défaut.
    if (Number.isNaN(soleil.france.lever) || Number.isNaN(soleil.france.coucher)) {
      soleil.france = { lever: SEUIL_MATIN_DEFAUT, coucher: SEUIL_BONSOIR_DEFAUT, date: soleil.france.date };
    }
  }
  afficher();
}

function rafraichir() {
  const franceOk = valide(soleil.france, FUSEAU_FRANCE);
  // Le bloc local rendu par le serveur doit correspondre à l'heure du navigateur
  const localOk = !afficherLocal || (valide(soleil.local, soleil.local?.fuseau || fuseauNav)
    && decalage(soleil.local.fuseau) === decalage(fuseauNav));
  if (franceOk && localOk) {
    afficher();
  } else {
    chargerDonnees();
  }
}

rafraichir();
// Rafraîchissement du texte toutes les 3 minutes (assez fin pour la zone 17h30-18h)
setInterval(rafraichir, 3 * 60 * 1000);


// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(error => {
        console.error('Error registering service worker:', error);
      });
  });
}
