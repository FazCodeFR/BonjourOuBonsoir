const CACHE_NAME = 'my-pwa-cache-v9';
const urlsToCache = [
    './',
    './index.js',
    './croissant.webp',
    'assets/facebook.webp',
    'assets/twitter.webp',
    './en/',
    './404.html',
    './favicon.ico',
    './fonts/open-sans-latin-wght-400-700.woff2',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            // cache: 'reload' contourne le cache HTTP pour précacher les versions à jour
            .then(cache => cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' }))))
            .then(() => self.skipWaiting())
    );
});

const putInCache = (request, response) => {
    // Ne mettre en cache que les réponses valides de même origine
    if (!response || response.status !== 200 || response.type !== 'basic') {
        return;
    }
    const responseToCache = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
};

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non-GET, externes et les scripts Cloudflare
    if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/cdn-cgi/')) {
        return;
    }

    // Pages HTML : réseau d'abord (contenu toujours à jour), cache en secours hors ligne
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    putInCache(request, response);
                    return response;
                })
                .catch(() => caches.match(request).then(response => response || caches.match('./')))
        );
        return;
    }

    // Ressources statiques : cache d'abord, réseau sinon
    event.respondWith(
        caches.match(request).then(response => response || fetch(request).then(networkResponse => {
            putInCache(request, networkResponse);
            return networkResponse;
        }))
    );
});

self.addEventListener('activate', event => {
    // Supprimer les anciens caches lors de l'activation du service worker
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});
