const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './index.css',
    './index.js',
    './croissant.png',
    'assets/facebook.png',
    'assets/twitter.png',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si la ressource est déjà en cache, la renvoyer depuis le cache
                if (response) {
                    return response;
                }

                // Sinon, faire une requête réseau et mettre la réponse en cache
                return fetch(event.request)
                    .then(response => {
                        // Vérifier que la réponse est valide et la mettre en cache
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            })
    );
});

self.addEventListener('activate', event => {
    // Supprimer les anciens caches lors de l'activation du service worker
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
