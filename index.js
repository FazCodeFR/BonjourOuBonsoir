// === Internationalisation (i18n) ===
// Le mot affiché (#bonText) reste en français — c'est le sujet pédagogique du site.
// Seuls l'UI, la FAQ et les méta sont traduits.
const I18N = {
  fr: {
    titlePage: "Faut-il dire bonjour ou bonsoir ?",
    h1: "Bonjour ou bonsoir ?",
    intro: "À cette heure en France, il est préférable de dire :",
    faqTitle: "Quand dire bonjour ou bonsoir ?",
    faqQ1: "À partir de quelle heure dit-on bonsoir ?",
    faqA1: "En France, on commence à dire « bonsoir » entre 17h30 et 18h selon la saison. En hiver, quand la nuit tombe vers 17h, on bascule dès 17h30 ; en été, on attend 18h car il fait encore jour.",
    faqQ2: "Jusqu'à quelle heure peut-on dire bonjour ?",
    faqA2: "« Bonjour » reste correct jusqu'à 17h30 toute l'année. Au-delà, et au plus tard à 18h, « bonsoir » prend le relais. Cette zone de bascule est typique du savoir-vivre français.",
    faqQ3: "Peut-on dire bonjour à 17h ?",
    faqA3: "Oui, sans hésiter. À 17h, l'usage est encore « bonjour » partout en France, quelle que soit la saison. La transition vers « bonsoir » ne commence qu'à partir de 17h30.",
    faqQ4: "Quelle différence entre « bonsoir » et « bonne soirée » ?",
    faqA4: "« Bonsoir » sert à saluer quelqu'un quand on le rencontre en fin de journée. « Bonne soirée » sert à prendre congé, en lui souhaitant une agréable fin de journée. On ne dit pas « bonne soirée » en arrivant.",
    faqQ5: "Quand dit-on « bonne nuit » ?",
    faqA5: "« Bonne nuit » se dit uniquement juste avant que la personne aille se coucher. Ce n'est pas une salutation du soir : pour saluer en soirée, on dit « bonsoir ».",
    faqQ6: "Pourquoi l'heure pour dire bonsoir change selon les saisons ?",
    faqA6: "L'usage français lie traditionnellement « bonsoir » à la tombée de la nuit. Le site se base sur le coucher du soleil réel à Paris, dans une fourchette comprise entre 17h30 et 18h pour rester cohérent avec les règles de politesse.",
    shareTitle: "Partage",
    twitterTitle: "Faire un tweet",
    facebookTitle: "Partager sur Facebook",
    githubTitle: "Github",
    githubLink: "Projet open source",
    made: "Made with ❤️ in France",
    metaDescription: "Faut-il dire bonjour ou bonsoir maintenant ? Réponse en temps réel selon l'heure et le coucher du soleil, basée sur les règles du savoir-vivre français.",
  },
  en: {
    titlePage: "Should I say bonjour or bonsoir?",
    h1: "Bonjour or bonsoir?",
    intro: "Right now in France, the polite greeting is:",
    faqTitle: "When to say bonjour or bonsoir?",
    faqQ1: "From what time should you say bonsoir?",
    faqA1: "In France, people start saying “bonsoir” between 5:30 PM and 6 PM depending on the season. In winter, when nightfall comes around 5 PM, the switch happens as early as 5:30 PM; in summer it waits until 6 PM because it's still daylight.",
    faqQ2: "Until what time can you say bonjour?",
    faqA2: "“Bonjour” stays correct until 5:30 PM all year round. After that, and at the latest by 6 PM, “bonsoir” takes over. This switching zone is typical of French etiquette.",
    faqQ3: "Can you say bonjour at 5 PM?",
    faqA3: "Yes, without a doubt. At 5 PM, “bonjour” is still the norm everywhere in France, whatever the season. The transition to “bonsoir” only begins at 5:30 PM.",
    faqQ4: "What's the difference between “bonsoir” and “bonne soirée”?",
    faqA4: "“Bonsoir” is used to greet someone you meet in the late afternoon or evening. “Bonne soirée” is a farewell, wishing someone a pleasant evening. You never say “bonne soirée” when arriving.",
    faqQ5: "When do you say “bonne nuit”?",
    faqA5: "“Bonne nuit” is only used right before someone goes to bed. It's not an evening greeting: to greet someone in the evening, you say “bonsoir”.",
    faqQ6: "Why does the time to say bonsoir change with the seasons?",
    faqA6: "French custom traditionally ties “bonsoir” to nightfall. The site uses the actual sunset in Paris, within a 5:30-6 PM window, to stay consistent with the rules of politeness.",
    shareTitle: "Share",
    twitterTitle: "Tweet this",
    facebookTitle: "Share on Facebook",
    githubTitle: "Github",
    githubLink: "Open source project",
    made: "Made with ❤️ in France",
    metaDescription: "Should I say bonjour or bonsoir right now? Live answer based on the time and the sunset in Paris, following French etiquette.",
  },
};

function detectLang() {
  const stored = localStorage.getItem("lang");
  if (stored && I18N[stored]) return stored;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("lang");
  if (fromUrl && I18N[fromUrl]) return fromUrl;
  const nav = (navigator.language || "fr").toLowerCase();
  return nav.startsWith("en") ? "en" : "fr";
}

function applyI18n(lang) {
  const dict = I18N[lang] || I18N.fr;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    if (dict[key] !== undefined) el.setAttribute("title", dict[key]);
  });

  document.documentElement.lang = lang;
  document.title = dict.titlePage;

  const metaPairs = [
    ["meta[name='description']", dict.metaDescription],
    ["meta[property='og:title']", dict.titlePage],
    ["meta[property='og:description']", dict.metaDescription],
    ["meta[name='twitter:title']", dict.titlePage],
    ["meta[name='twitter:description']", dict.metaDescription],
  ];
  metaPairs.forEach(([selector, value]) => {
    const el = document.querySelector(selector);
    if (el && value) el.setAttribute("content", value);
  });

  document.querySelectorAll(".lang-switch button").forEach(btn => {
    const isActive = btn.dataset.lang === lang;
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    btn.classList.toggle("is-active", isActive);
  });
}

function setupLangSwitch() {
  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (!I18N[lang]) return;
      localStorage.setItem("lang", lang);
      applyI18n(lang);
    });
  });
}

applyI18n(detectLang());
setupLangSwitch();

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

function updateBonText() {
  const now = new Date();
  const heureCourante = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const text = getSalutation(heureCourante, leverSoleil, coucherSoleil);
  document.getElementById('bonText').textContent = text;
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
      .register('./service-worker.js')
      .then(registration => {
        console.log('Service worker registered!', registration);
      })
      .catch(error => {
        console.error('Error registering service worker:', error);
      });
  });
}
