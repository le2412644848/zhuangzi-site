"use client";

import { useEffect } from "react";

/**
 * 注册 Service Worker（不包裹任何 children 的独立副作用组件）。
 *
 * 关键点：sw.js 在 install 里调用 skipWaiting()、activate 里 clients.claim()，
 * 新版本会立刻接管已打开的页面。Next.js 的 JS chunk 是内容哈希命名的，
 * 接管后旧页面再去取已被清掉的 chunk 就会白屏。
 * 因此监听 controllerchange，在控制权切换时整页重载一次（用标志位防循环）。
 *
 * 视觉复审 V7-4：原实现每次 controllerchange 都重载，回访用户偶发
 * 「多刷一次」。现改为仅在「首帧已完成且存在在途请求」时才重载 ——
 * 页面空闲时跳过，交给下一次导航自然接管新 SW。
 */
function registerSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  let reloading = false;
  let pageLoaded = false; // 首帧是否已完成（load 事件）
  let inflight = 0;       // 在途 fetch 计数

  // 追踪在途请求：SW 接管时若页面正在取数，重载可避免拿旧缓存数据；
  // 页面空闲时跳过，消除回访时「偶发多刷一次」。
  const origFetch = window.fetch.bind(window);
  window.fetch = (...args) => {
    inflight += 1;
    return origFetch(...args).finally(() => {
      inflight -= 1;
    });
  };

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // 首次安装时 controller 从 null 变为新 SW，此时无需重载
    if (reloading || !navigator.serviceWorker.controller) return;
    // 仅在「首帧已完成且存在在途请求」时才重载，其余交给下一次导航自然接管
    if (!pageLoaded || inflight === 0) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    pageLoaded = true;
    // 延迟至首屏彻底空闲后再注册 SW，避免安装线程与首屏渲染争抢网络/主线程
    window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silently fail — SW is progressive enhancement
      });
    }, 4000);
  });
}

export default function SWRegister() {
  useEffect(() => {
    registerSW();
  }, []);
  return null;
}
