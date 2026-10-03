import { parseHeureAmPm, heureDans, FUSEAU_FRANCE, SEUIL_MATIN_DEFAUT, SEUIL_BONSOIR_DEFAUT } from '../../salutation.js';

// API publique pour récupérer lever/coucher du soleil d'une position et d'une date.
const API_SOLEIL = 'https://api.sunrise-sunset.org/json';

export const PARIS = { lat: 48.8566, lng: 2.3522, fuseau: FUSEAU_FRANCE, ville: 'Paris' };

const TTL_OK = 24 * 60 * 60;   // données du jour : 24 h
const TTL_REPLI = 5 * 60;      // échec API : on réessaie dans 5 min
const TIMEOUT_API = 1500;      // ms, pour ne jamais trop retarder la page
const MEMOIRE_MAX = 200;

// Mémoire de l'isolate Worker : évite même la lecture du cache pour les requêtes suivantes.
const memoire = new Map(); // cle -> { date, lever, coucher, expire }

// Renvoie { lever, coucher, date } (heures décimales, heure locale du fuseau) pour la date du jour sur place.
export async function getSoleil({ lat, lng, fuseau } = PARIS) {
  const { date } = heureDans(fuseau);
  if (lat === null || lng === null) {
    return { date, lever: SEUIL_MATIN_DEFAUT, coucher: SEUIL_BONSOIR_DEFAUT };
  }
  // Coordonnées arrondies à 0,1° (~10 km) pour partager le cache entre visiteurs voisins
  const url = `${API_SOLEIL}?lat=${lat.toFixed(1)}&lng=${lng.toFixed(1)}&tzid=${encodeURIComponent(fuseau)}&date=${date}`;
  const enMemoire = memoire.get(url);
  if (enMemoire && enMemoire.expire > Date.now()) {
    return enMemoire;
  }

  const cache = caches.default;
  const cleCache = new Request(url);

  let donnees = null;
  let ttl = TTL_OK;
  try {
    const enCache = await cache.match(cleCache);
    const response = enCache || await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_API) });
    const data = await response.json();
    if (data && data.status === 'OK' && data.results) {
      donnees = {
        lever: parseHeureAmPm(data.results.sunrise),
        coucher: parseHeureAmPm(data.results.sunset),
      };
      // On ne met en cache que les réponses valides
      if (!enCache) {
        await cache.put(cleCache, new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${TTL_OK}` },
        }));
      }
    }
  } catch (e) {
    // En cas d'échec API, on garde les valeurs par défaut (6h / 18h).
  }

  if (!donnees) {
    donnees = { lever: SEUIL_MATIN_DEFAUT, coucher: SEUIL_BONSOIR_DEFAUT };
    ttl = TTL_REPLI;
  }
  const resultat = { date, ...donnees, expire: Date.now() + ttl * 1000 };
  if (memoire.size >= MEMOIRE_MAX) memoire.delete(memoire.keys().next().value);
  memoire.set(url, resultat);
  return resultat;
}

// "America/Toronto" -> "Toronto", "America/Argentina/Buenos_Aires" -> "Buenos Aires"
function villeDuFuseau(fuseau) {
  return fuseau.split('/').pop().replace(/_/g, ' ');
}

function fuseauValide(fuseau) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: fuseau });
    return true;
  } catch (e) {
    return false;
  }
}

// Position approximative du visiteur : paramètres explicites (API) sinon géolocalisation IP de Cloudflare.
// Renvoie { lat, lng, fuseau, ville } (lat/lng null si inconnues) ou null si le fuseau est inconnu.
export function positionVisiteur(request, params = new URLSearchParams()) {
  const cf = request.cf || {};
  const fuseau = params.get('tz') || cf.timezone;
  if (!fuseau || !fuseauValide(fuseau)) return null;

  // Les coordonnées et la ville de l'IP ne valent que si le fuseau est bien celui de l'IP (pas de VPN)
  const memeLieuQueIp = fuseau === cf.timezone;
  let lat = parseFloat(params.get('lat') ?? (memeLieuQueIp ? cf.latitude : NaN));
  let lng = parseFloat(params.get('lng') ?? (memeLieuQueIp ? cf.longitude : NaN));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    // Position inconnue : getSoleil appliquera les horaires par défaut (6h / 18h)
    lat = null;
    lng = null;
  }

  const ville = memeLieuQueIp && cf.city && !params.get('lat') ? cf.city : villeDuFuseau(fuseau);
  return { lat, lng, fuseau, ville };
}
