// ──────────────────────────────────────────
// Service Worker for 莊子數位典藏
// Cache-First strategy for static assets,
// Network-First for HTML, offline fallback
// ──────────────────────────────────────────

const CACHE_STATIC = "zhuangzi-static-v1";
const CACHE_PAGES = "zhuangzi-pages-v1";
const CACHE_JSON = "zhuangzi-json-v1";

const PRECACHE_URLS = [
  "/",
  "/chapters/",
  "/concepts/",
  "/quotes/",
  "/fables/",
  "/search/",
  "/manifest.json",
  "/404.html",
];

// ── Install: precache core pages ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_PAGES).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Silently continue if some fail
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.startsWith("zhuangzi-") && k !== CACHE_STATIC && k !== CACHE_PAGES && k !== CACHE_JSON)
          .map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: strategy-based routing ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and API calls
  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  // Static assets with content hash → Cache-First (immutable)
  if (url.pathname.includes("/_next/static/") || /\.(png|svg|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(event.request, clone));
            return response;
          })
        );
      })
    );
    return;
  }

  // JSON data → Stale-While-Revalidate
  if (/\.json$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_JSON).then((cache) => {
        return cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request)
            .then((response) => {
              cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // HTML pages → Network-First with offline fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_PAGES).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/404/") || new Response("离线不可用", { status: 503 });
        });
      })
  );
});
