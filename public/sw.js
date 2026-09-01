const VERSION = "aklassenhoiz-public-__BUILD_VERSION__";
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

self.addEventListener("push", (event) => {
  let payload = {
    title: "A-KlassenHoiz",
    body: "Du hast eine neue Benachrichtigung.",
    url: "/start",
    tag: "a-klassenhoiz",
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Keep the safe generic notification when a payload cannot be parsed.
  }
  const badgeCount = Number.isFinite(payload.badgeCount)
    ? Math.max(0, Math.floor(payload.badgeCount))
    : null;
  const badgeUpdate =
    badgeCount !== null && badgeCount > 0 && typeof self.navigator?.setAppBadge === "function"
      ? self.navigator.setAppBadge(badgeCount).catch(() => undefined)
      : badgeCount === 0 && typeof self.navigator?.clearAppBadge === "function"
        ? self.navigator.clearAppBadge().catch(() => undefined)
        : Promise.resolve();
  const notification = self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag,
    data: { url: payload.url },
  });
  event.waitUntil(Promise.all([notification, badgeUpdate]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedTarget = new URL(
    event.notification.data?.url || "/start",
    self.location.origin,
  );
  const target =
    requestedTarget.origin === self.location.origin
      ? requestedTarget
      : new URL("/start", self.location.origin);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ("navigate" in client) await client.navigate(target.href);
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(target.href);
    }),
  );
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
