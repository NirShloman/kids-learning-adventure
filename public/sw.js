const CACHE_NAME = 'yedale-v1.3.2-name-20260827';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/favicon-32.png',
  '/icons/icon-192.png',
  '/assets/brand/yadaale-mark.webp',
  '/assets/brand/yadaale-logo-horizontal.webp'
];

function isSameOriginRequest(request) {
  return new URL(request.url).origin === self.location.origin;
}

async function cacheResponse(cacheKey, response) {
  if (!response || !response.ok || response.status === 206) return response;
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'PREPARE_ADVENTURE_OFFLINE') {
    const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
    const allowed = urls.length > 0 && urls.length < 2000 && urls.every(url =>
      typeof url === 'string' && /^\/assets\/(experience\/v2\/|audio\/narration\/|images\/objects\/)/.test(url) && !url.includes('..'));
    event.waitUntil((async () => {
      if (!allowed) { event.ports[0]?.postMessage({ok:false}); return; }
      const cache = await caches.open(CACHE_NAME);
      let cursor = 0, ok = true;
      await Promise.all(Array.from({length:4}, async () => {
        while (cursor < urls.length) {
          const url = urls[cursor++];
          if (await cache.match(url)) continue;
          try {
            const response = await fetch(url);
            if (!response.ok || response.status === 206 || response.headers.get('content-type')?.includes('text/html')) { ok = false; continue; }
            await cache.put(url, response);
          } catch { ok = false; }
        }
      }));
      event.ports[0]?.postMessage({ok});
    })());
    return;
  }
  if (event.data?.type === 'WARM_ADVENTURE_CACHE') {
    const urls = Array.isArray(event.data.urls) ? event.data.urls.filter((url) => typeof url === 'string' && url.startsWith('/assets/experience/v2/') && !url.includes('..')) : [];
    event.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urls) {
        if (await cache.match(url)) continue;
        try { const response = await fetch(url); if (response.ok) await cache.put(url, response); } catch { /* A later visit retries warming. */ }
      }
    }));
    return;
  }
  if (event.data?.type !== 'WARM_AUDIO_CACHE') return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const manifestResponse = await fetch('/assets/audio/audio-manifest.json');
    if (!manifestResponse.ok) return;
    await cache.put('/assets/audio/audio-manifest.json', manifestResponse.clone());
    const manifest = await manifestResponse.json();
    const mp3Urls = manifest.assets
      .map((asset) => asset.sources?.mp3)
      .filter(Boolean)
      .map((path) => `/assets/audio/${path}`);
    for (const url of mp3Urls) {
      if (await cache.match(url)) continue;
      try {
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch {
        // Background warming is best-effort and must never affect gameplay.
      }
    }
  })());
});
