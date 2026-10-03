// Logique partagée entre la page (index.js) et les Cloudflare Pages Functions.

// === Constantes du savoir-vivre français ===
// Heure (en décimal) à partir de laquelle on peut commencer à dire "Bonjour"
// même avant le lever du soleil (ex. en été le soleil se lève vers 5h30).
export const SEUIL_MATIN_DEFAUT = 6;          // 6 h 00
// Plancher de la zone de bascule : avant 17h30, on dit toujours "Bonjour".
export const SEUIL_BONSOIR_SAVOIR_VIVRE = 17.5; // 17 h 30
// Plafond de la zone de bascule : à partir de 18h, on dit toujours "Bonsoir".
export const SEUIL_BONSOIR_DEFAUT = 18;       // 18 h 00

// Convertit "6:28:05 AM" -> 6.4680 (heures décimales)
export function parseHeureAmPm(timeStr) {
  const [time, period] = timeStr.split(' ');
  let [h, m, s] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h + m / 60 + s / 3600;
}

// Seuil du matin : on prend le lever du soleil, mais jamais plus tôt que 6h.
// (Sinon en été on dirait "Bonjour" à 5h45, ce qui est inhabituel.)
export function calculerSeuilMatin(lever) {
  return Math.max(SEUIL_MATIN_DEFAUT, lever);
}

// Seuil du soir (zone de bascule 17h30 - 18h) :
//   seuil_naturel = MAX(17h30, coucher_soleil - 30 min)
//   seuil_soir    = MIN(18h, seuil_naturel)
// En hiver le soleil se couche vers 17h, donc on bascule à 17h30.
// En été il se couche vers 21h, donc on plafonne à 18h.
// À la mi-saison, on bascule ~30 min avant le coucher.
export function calculerSeuilSoir(coucher) {
  const seuilNaturel = Math.max(SEUIL_BONSOIR_SAVOIR_VIVRE, coucher - 0.5);
  return Math.min(SEUIL_BONSOIR_DEFAUT, seuilNaturel);
}

export function getSalutation(heureCourante, lever, coucher) {
  const seuilMatin = calculerSeuilMatin(lever);
  const seuilSoir = calculerSeuilSoir(coucher);
  return (heureCourante >= seuilMatin && heureCourante < seuilSoir)
    ? 'Bonjour'
    : 'Bonsoir';
}

// Formate une heure décimale selon la langue de la page : 17.6667 -> "17h40" (fr) / "5:40 PM" (en)
export function formaterHeure(decimal, lang) {
  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = String(totalMinutes % 60).padStart(2, '0');
  if (lang === 'en') {
    return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
  }
  return `${h}h${m}`;
}

export const FUSEAU_FRANCE = 'Europe/Paris';

// Formateurs Intl mis en cache par fuseau (leur création est coûteuse).
const formateurs = new Map();
function formateur(fuseau, avecDecalage = false) {
  const cle = fuseau + avecDecalage;
  if (!formateurs.has(cle)) {
    formateurs.set(cle, new Intl.DateTimeFormat('en-CA', avecDecalage
      ? { timeZone: fuseau, timeZoneName: 'longOffset' }
      : {
        timeZone: fuseau,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hourCycle: 'h23',
      }));
  }
  return formateurs.get(cle);
}

// Heure et date dans un fuseau donné, quel que soit le fuseau de la machine (le serveur est en UTC).
// Renvoie { heure: 18.2, date: "2026-10-03" }
export function heureDans(fuseau, date = new Date()) {
  const p = Object.fromEntries(formateur(fuseau).formatToParts(date).map(({ type, value }) => [type, value]));
  return {
    heure: Number(p.hour) + Number(p.minute) / 60 + Number(p.second) / 3600,
    date: `${p.year}-${p.month}-${p.day}`,
  };
}

export function heureParis(date = new Date()) {
  return heureDans(FUSEAU_FRANCE, date);
}

// Décalage UTC d'un fuseau à un instant donné : "GMT+02:00"
export function decalage(fuseau, date = new Date()) {
  return formateur(fuseau, true).formatToParts(date).find(p => p.type === 'timeZoneName').value;
}

// Vrai si le fuseau a la même heure que la France à cet instant (ex. Bruxelles, Madrid).
export function memeHeureQueParis(fuseau, date = new Date()) {
  try {
    return decalage(fuseau, date) === decalage(FUSEAU_FRANCE, date);
  } catch (e) {
    return true; // fuseau inconnu : on n'affiche que la France
  }
}

// État complet à un instant donné, à partir du lever/coucher du jour (heures décimales, heure locale du fuseau).
export function etatActuel(lever, coucher, lang = 'fr', date = new Date(), fuseau = FUSEAU_FRANCE) {
  const { heure } = heureDans(fuseau, date);
  return {
    reponse: getSalutation(heure, lever, coucher),
    // Heure affichée tronquée à la minute (18:12:40 -> 18h12)
    heure: formaterHeure(Math.floor(heure * 60) / 60, lang),
    bascule: formaterHeure(calculerSeuilSoir(coucher), lang),
    lever: formaterHeure(lever, lang),
    coucher: formaterHeure(coucher, lang),
  };
}
