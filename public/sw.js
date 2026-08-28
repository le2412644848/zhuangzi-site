// ──────────────────────────────────────────
// Service Worker — 莊子數位典藏
//
// 策略：
//   /_next/static/*, 图片  → Cache-First（内容哈希命名，不可变）
//   *.json                 → Stale-While-Revalidate
//   HTML 导航              → Network-First + 离线回退
//
// 版本号 -v1 由 scripts/bump-sw-version.mjs 在 build 后替换为 BUILD_ID，
// 使每次部署自动失效旧缓存。
// ──────────────────────────────────────────

const CACHE_STATIC = "zhuangzi-static-v1";
const CACHE_PAGES = "zhuangzi-pages-v1";
const CACHE_JSON = "zhuangzi-json-v1";

const CURRENT_CACHES = [CACHE_STATIC, CACHE_PAGES, CACHE_JSON];

// 缓存条目上限。章节页 HTML 单页可达 1MB（齐物论 ~1MB），33 篇全缓存
// 叠加 1.5MB 级的 JSON 数据，很容易触发浏览器存储配额而导致整个
// Cache Storage 被清空。原实现没有任何上限。
const MAX_ENTRIES = {
  [CACHE_PAGES]: 40,
  [CACHE_JSON]: 30,
  [CACHE_STATIC]: 120,
};

// trailingSlash: true 的静态导出同时产出 /404.html 与 /404/index.html。
// 原实现预缓存 "/404.html" 却回退到 caches.match("/404/") —— 键不一致，
// 离线回退永远命中不了。这里两者都预缓存，回退时按顺序尝试。
const OFFLINE_FALLBACKS = ["/404/", "/404.html"];

const PRECACHE_URLS = [
  "/",
  "/chapters/",
  "/concepts/",
  "/quotes/",
  "/fables/",
  "/manifest.json",
  ...OFFLINE_FALLBACKS,
];

// ── 工具 ──

/** 只缓存**自己域名**下、状态正常、非 partial 的响应。 */
function isCacheable(request, response) {
  if (!response) return false;
  // opaque 响应（cors: no-cors 的跨域资源）status 恒为 0，内容无法校验
  if (response.type === "opaque" || response.type === "opaqueredirect") return false;
  if (!response.ok) return false;          // 4xx/5xx 不入缓存
  if (response.status === 206) return false; // Range 请求片段
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false; // 高德瓦片/cdnjs 不缓存
  return true;
}

/** 按 FIFO 裁剪缓存条目数，防止无界增长撑爆配额。 */
async function trimCache(cacheName, maxEntries) {
  if (!maxEntries) return;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  // Cache Storage 的 keys() 按插入顺序返回，删最旧的
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

async function putSafely(cacheName, request, response) {
  if (!isCacheable(request, response)) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  await trimCache(cacheName, MAX_ENTRIES[cacheName]);
}

async function offlineFallback() {
  for (const url of OFFLINE_FALLBACKS) {
    const hit = await caches.match(url);
    if (hit) return hit;
  }
  return new Response(
    "<!doctype html><meta charset=utf-8><title>离线</title>" +
      "<body style=\"font-family:serif;padding:2rem;text-align:center\">" +
      "<h1>離線</h1><p>当前页面尚未缓存，请连网后重试。</p>",
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// ── Install：预缓存核心页面 ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_PAGES);
      // 逐个 add，避免 addAll 里任意一个 404 就整体 reject
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

// ── Activate：清理旧版本缓存 + 开启导航预载 ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 导航预载：让 SW 启动与网络请求并行，减少导航延迟
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable().catch(() => {});
      }
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("zhuangzi-") && !CURRENT_CACHES.includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ── Fetch ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 跨域请求（高德地图瓦片）交给浏览器默认处理，不进我们的缓存。
  // Leaflet 标记图标已自托管（/vendor/leaflet/，见 TODO 3.9）。
  if (url.origin !== self.location.origin) return;

  // AI 代理绝不缓存
  if (url.pathname.startsWith("/api/")) return;

  // 1) 带内容哈希的静态资源 + 图片 → Cache-First
  if (
    url.pathname.includes("/_next/static/") ||
    /\.(png|svg|ico|webp|avif|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          await putSafely(CACHE_STATIC, request, response.clone());
          return response;
        } catch {
          // 静态资源取不到就如实失败，交由页面自身处理
          return Response.error();
        }
      })()
    );
    return;
  }

  // 2) JSON 数据 → Stale-While-Revalidate
  if (/\.json$/.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const network = fetch(request)
          .then(async (response) => {
            await putSafely(CACHE_JSON, request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })()
    );
    return;
  }

  // 3) 页面导航 → Network-First，失败回退缓存 / 离线页
  if (request.mode === "navigate" || /\.html?$/.test(url.pathname) || url.pathname.endsWith("/")) {
    event.respondWith(
      (async () => {
        try {
          // 若启用了 navigationPreload，优先用预载响应
          const preload = await event.preloadResponse;
          const response = preload || (await fetch(request));
          await putSafely(CACHE_PAGES, request, response.clone());
          return response;
        } catch {
          const cached = await caches.match(request, { ignoreSearch: true });
          return cached || (await offlineFallback());
        }
      })()
    );
  }
});

// 允许页面主动要求新 SW 立即接管（配合前端「有新版本」提示）
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
