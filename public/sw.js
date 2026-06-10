// Bump this version any time you want to flush stale caches
const CACHE = "life-os-v5";

// Only cache static assets — never the HTML page itself
const STATIC_EXTS = /\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf)(\?.*)?$/;

// Install: claim immediately, no pre-caching of HTML
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate: wipe every old cache version
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept API calls or Next.js internal routes
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data/")) return;

  // HTML navigation requests — stale-while-revalidate.
  // Serve the cached shell instantly so the loader shows immediately on every open.
  // Always fetch fresh in the background and update the cache.
  if (request.mode === "navigate") {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match("/");
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res.ok) cache.put("/", res.clone());
            return res;
          })
          .catch(() => cached); // offline: serve stale
        // If we have a cached shell, return it immediately; update in background.
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Static assets — cache first, then network
  if (STATIC_EXTS.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Everything else — network only
});

// Push notifications
self.addEventListener("push", (e) => {
  let data = { title: "Life OS", body: "Tap to open your dashboard." };
  try { data = e.data?.json() ?? data; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "life-os",
      renotify: true,
      data: { url: data.url || "/" },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = e.notification.data?.url || "/";
  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if (c.url.startsWith(self.registration.scope) && "focus" in c) return c.focus();
        }
        if (clients.openWindow) return clients.openWindow(target);
      })
  );
});
