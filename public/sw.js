const VERSION = "aklassenhoiz-public-v3";
const PUBLIC_ASSETS = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PUBLIC_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function isPublicAsset(url) {
  return (
    url.origin === self.location.origin &&
    (PUBLIC_ASSETS.includes(url.pathname) || url.pathname.startsWith("/icons/"))
  );
}

function isNextStaticAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
}

async function fetchAndCachePublicAsset(request) {
  const response = await fetch(request);
  if (!response.ok) return response;

  // Clone while the network body is still untouched. The original response is
  // only returned after the cache operation has settled.
  const cacheableResponse = response.clone();
  try {
    const cache = await caches.open(VERSION);
    await cache.put(request, cacheableResponse);
  } catch {
    // A cache write must never make an otherwise valid network response fail.
  }
  return response;
}

async function fetchNextStaticAsset(request) {
  try {
    return await fetchAndCachePublicAsset(request);
  } catch {
    return (await caches.match(request)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  if (isNextStaticAsset(url)) {
    event.respondWith(fetchNextStaticAsset(request));
    return;
  }

  if (isPublicAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetchAndCachePublicAsset(request)),
    );
  }
});
