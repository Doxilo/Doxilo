/* ============================================================
   Doxilo — Nova service worker
   Offline-first shell for the single-file app + PWA icons.
   v2: resilient precache (one missing asset no longer breaks
   installation), live app shell always cached on first load.
   ============================================================ */
const VERSION = "nova-v2";
const SHELL = "doxilo-shell-" + VERSION;
const RUNTIME = "doxilo-runtime-" + VERSION;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/nova-mark.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) =>
        // addAll rejects the whole install if ANY file 404s; add each
        // resource individually so offline never depends on one asset
        Promise.allSettled(PRECACHE.map((u) => cache.add(u)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL && k !== RUNTIME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match("./index.html")).then((hit) => hit || caches.match("./"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) {
        fetch(req)
          .then((res) => {
            if (res && res.ok) caches.open(RUNTIME).then((c) => c.put(req, res)).catch(() => {});
          })
          .catch(() => {});
        return hit;
      }
      return fetch(req)
        .then((res) => {
          if (res && res.ok && (url.pathname.endsWith(".png") || url.pathname.endsWith(".svg") || url.pathname.endsWith(".webmanifest"))) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});
