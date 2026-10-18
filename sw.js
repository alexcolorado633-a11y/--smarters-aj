const CACHE_NAME = 'aj-smarters-v1';
const ARQUIVOS_PARA_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ARQUIVOS_PARA_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((nomes) => {
            return Promise.all(
                nomes.filter(nome => nome !== CACHE_NAME)
                    .map(nome => caches.delete(nome))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((respostaCache) => {
                return respostaCache || fetch(event.request)
                    .then((respostaRede) => {
                        return caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, respostaRede.clone());
                                return respostaRede;
                            });
                    });
            })
    );
});
