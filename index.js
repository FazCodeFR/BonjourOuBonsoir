// === Constantes du savoir-vivre français ===
// Heure (en décimal) à partir de laquelle on peut commencer à dire "Bonjour"
// même avant le lever du soleil (ex. en été le soleil se lève vers 5h30).
const SEUIL_MATIN_DEFAUT = 6;          // 6 h 00
// Plancher de la zone de bascule : avant 17h30, on dit toujours "Bonjour".
const SEUIL_BONSOIR_SAVOIR_VIVRE = 17.5; // 17 h 30
// Plafond de la zone de bascule : à partir de 18h, on dit toujours "Bonsoir".
const SEUIL_BONSOIR_DEFAUT = 18;       // 18 h 00

// API publique (Paris par défaut) pour récupérer lever/coucher du soleil.
const API_PARIS = 'https://api.sunrise-sunset.org/json?lat=48.8566&lng=2.3522&date=today&tzid=Europe/Paris';

// Valeurs par défaut, écrasées par l'API si elle répond.
let leverSoleil = SEUIL_MATIN_DEFAUT;
let coucherSoleil = SEUIL_BONSOIR_DEFAUT;

// Convertit "6:28:05 AM" -> 6.4680 (heures décimales)
function parseHeureAmPm(timeStr) {
  const [time, period] = timeStr.split(' ');
  let [h, m, s] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h + m / 60 + s / 3600;
}

// Seuil du matin : on prend le lever du soleil, mais jamais plus tôt que 6h.
// (Sinon en été on dirait "Bonjour" à 5h45, ce qui est inhabituel.)
function calculerSeuilMatin(lever) {
  return Math.max(SEUIL_MATIN_DEFAUT, lever);
}

// Seuil du soir (zone de bascule 17h30 - 18h) :
//   seuil_naturel = MAX(17h30, coucher_soleil - 30 min)
//   seuil_soir    = MIN(18h, seuil_naturel)
// En hiver le soleil se couche vers 17h, donc on bascule à 17h30.
// En été il se couche vers 21h, donc on plafonne à 18h.
// À la mi-saison, on bascule ~30 min avant le coucher.
function calculerSeuilSoir(coucher) {
  const seuilNaturel = Math.max(SEUIL_BONSOIR_SAVOIR_VIVRE, coucher - 0.5);
  return Math.min(SEUIL_BONSOIR_DEFAUT, seuilNaturel);
}

function getSalutation(heureCourante, lever, coucher) {
  const seuilMatin = calculerSeuilMatin(lever);
  const seuilSoir = calculerSeuilSoir(coucher);
  return (heureCourante >= seuilMatin && heureCourante < seuilSoir)
    ? 'Bonjour'
    : 'Bonsoir';
}

// Formate une heure décimale selon la langue de la page : 17.6667 -> "17h40" (fr) / "5:40 PM" (en)
function formaterHeure(decimal, lang) {
  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = String(totalMinutes % 60).padStart(2, '0');
  if (lang === 'en') {
    return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
  }
  return `${h}h${m}`;
}

function updateBonText() {
  const now = new Date();
  const heureCourante = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const text = getSalutation(heureCourante, leverSoleil, coucherSoleil);
  document.getElementById('bonText').textContent = text;
  document.getElementById('switchTime').textContent =
    formaterHeure(calculerSeuilSoir(coucherSoleil), document.documentElement.lang);
}

async function chargerDonneesSoleil() {
  try {
    const response = await fetch(API_PARIS);
    const data = await response.json();
    if (data && data.status === 'OK' && data.results) {
      leverSoleil = parseHeureAmPm(data.results.sunrise);
      coucherSoleil = parseHeureAmPm(data.results.sunset);
    }
  } catch (e) {
    // En cas d'échec API, on garde les valeurs par défaut (6h / 18h).
  }
  updateBonText();
}

chargerDonneesSoleil();
// Rafraîchissement du texte toutes les 3 minutes (assez fin pour la zone 17h30-18h)
setInterval(updateBonText, 3 * 60 * 1000);
// Rafraîchissement des données solaires toutes les 6 heures (lever/coucher change peu en 24 h)
setInterval(chargerDonneesSoleil, 6 * 60 * 60 * 1000);


// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('Service worker registered!', registration);
      })
      .catch(error => {
        console.error('Error registering service worker:', error);
      });
  });
}
