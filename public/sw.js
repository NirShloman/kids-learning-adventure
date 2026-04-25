const CACHE_NAME = 'kids-learning-adventure-web-v1.1.3';
const STATIC_ASSETS = ['/', '/manifest.webmanifest', '/icons/icon.svg'];
const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const IS_LOCAL_DEV = LOCAL_DEV_HOSTS.has(self.location.hostname);

function isSameOriginRequest(request) {
  return new URL(request.url).origin === self.location.origin;
}

function cacheResponse(cacheKey, response) {
  if (!response || !response.ok) return response;

  const copy = response.clone();
  caches.open(CACHE_NAME)
    .then((cache) => cache.put(cacheKey, copy))
    .catch(() => undefined);
  return response;
}

if (IS_LOCAL_DEV) {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll({ type: 'window' }))
        .then((clients) => Promise.all(clients.map((client) => client.navigate(client.url).catch(() => undefined))))
    );
  });
} else {
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
    if (event.request.method !== 'GET') return;
    if (!isSameOriginRequest(event.request)) return;

    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request)
          .then((response) => cacheResponse('/', response))
          .catch(() => caches.match('/'))
      );
      return;
    }

    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => cacheResponse(event.request, response))
          .catch(() => caches.match('/'));
      })
    );
  });
}
