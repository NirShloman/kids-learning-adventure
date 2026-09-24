const CACHE_NAME = 'olamia-v1.3.2-name-20260827';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/favicon-32.png',
  '/icons/icon-192.png',
  '/assets/brand/olamia-mark.webp',
  '/assets/brand/olamia-logo-horizontal.webp'
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

async function narrationResponse(request) {
  // Media elements request byte ranges. Cache one complete, immutable recording
  // on demand so subsequent ranges can also be served without a network.
  const url = request.url;
  let response = await caches.match(url);
  if (!response) {
    const headers = new Headers(request.headers);
    headers.delete('range');
    response = await fetch(new Request(request, { headers }));
    if (response.status === 200 && response.headers.get('content-type')?.includes('audio/')) {
      await cacheResponse(url, response);
    }
  }
  const range = request.headers.get('range');
  if (!range || response.status !== 200) return response;
  const bytes = await response.arrayBuffer();
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = match?.[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match?.[2]));
  const end = match?.[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
  if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= bytes.byteLength) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.byteLength}` } });
  }
  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Range', `bytes ${start}-${end}/${bytes.byteLength}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
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

  if (new URL(event.request.url).pathname.startsWith('/assets/audio/narration/')) {
    event.respondWith(narrationResponse(event.request));
    return;
  }

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
