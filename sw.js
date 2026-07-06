const CACHE_NAME = 'payday-pro-v2';
const BASE_PATH = '/payday-countdown-manager';

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/app.js`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
     .then(cache => cache.addAll(urlsToCache))
     .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names => Promise.all(
      names.map(name => name!== CACHE_NAME? caches.delete(name) : null)
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
     .then(res => res || fetch(e.request))
     .catch(() => e.request.mode === 'navigate'
       ? caches.match(`${BASE_PATH}/index.html`)
        : null
      )
  );
});
