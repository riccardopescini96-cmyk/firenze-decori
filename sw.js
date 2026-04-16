const CACHE_NAME = 'firenze-decori-static-v7';
const PRECACHE_URLS = [
  '/',
  '/css/styles.min.css',
  '/css/styles.min.css?v=20260414-final',
  '/js/main.min.js',
  '/js/main.min.js?v=20260414-final',
  '/assets/img/logo.webp?v=20260414-logo'
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
    const isCodeAsset = request.destination === 'style' || request.destination === 'script';

    const networkResponse = fetch(request)
      .then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }

        return response;
      });

    if (isCodeAsset) {
      try {
        return await networkResponse;
      } catch (error) {
        if (cachedResponse) {
          return cachedResponse;
        }

        return Response.error();
      }
    }

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
