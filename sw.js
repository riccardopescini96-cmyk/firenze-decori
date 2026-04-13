const CACHE_NAME = 'firenze-decori-static-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.min.css',
  '/js/main.min.js',
  '/assets/img/logo_last_nav.webp',
  '/assets/img/logo_last_nav.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    return;
  }

  if (!['style', 'script', 'image', 'font'].includes(request.destination)) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    const networkResponse = fetch(request)
      .then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }

        return response;
      });

    if (cachedResponse) {
      event.waitUntil(networkResponse.catch(() => {}));
      return cachedResponse;
    }

    try {
      return await networkResponse;
    } catch (error) {
      return Response.error();
    }
  })());
});
