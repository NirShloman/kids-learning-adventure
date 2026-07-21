const CACHE_NAME = 'lomdim-bekef-v1.2.0-20260721';
const STATIC_ASSETS = ['/', '/manifest.webmanifest', '/icons/icon.svg'];

function isSameOriginRequest(request) {
  return new URL(request.url).origin === self.location.origin;
}

async function cacheResponse(cacheKey, response) {
  if (!response || !response.ok) return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(cacheKey, response.clone());
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !isSameOriginRequest(event.request)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => cacheResponse('/', response))
        .catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request)
      .then((response) => cacheResponse(event.request, response))
      .catch(() => caches.match('/')))
  );
});
