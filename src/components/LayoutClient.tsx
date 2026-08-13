"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ReadingModeProvider, useReadingMode } from "./ReadingModeProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import Navigation from "./Navigation";
import ReadingProgress from "./ReadingProgress";

// 聊天球按需加载：内部静态引用 search → 全量章节数据(656KB)，
// 直接静态导入会把整包数据塞进每个页面的首屏 bundle。
// 延迟到交互/空闲后再拉取，首包体积显著下降。
const ChatWithZhuangzi = dynamic(() => import("./ChatWithZhuangzi"), {
  ssr: false,
  loading: () => null,
});

function registerSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silently fail — SW is progressive enhancement
    });
  });
}

function Footer() {
  const { immersive } = useReadingMode();
  if (immersive) return null;

  return (
    <footer className="border-t border-[var(--border-light)] bg-[var(--bg-secondary)] no-print mt-auto text-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="text-lg font-semibold tracking-[0.08em] text-[var(--text-accent)] font-serif">
              莊子
            </Link>
            <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
              三十三篇，千古文章。<br />
              以无为之姿，游无穷之境。
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)] tracking-[0.1em] uppercase mb-3">阅读</h4>
            <div className="space-y-2">
              {[
                { href: "/chapters", label: "篇章" }, { href: "/concepts", label: "核心概念" },
                { href: "/quotes", label: "名句精选" }, { href: "/fables", label: "寓言故事" },
                { href: "/reading-routes", label: "主题路线" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)] tracking-[0.1em] uppercase mb-3">探索</h4>
            <div className="space-y-2">
              {[
                { href: "/search", label: "全文搜索" }, { href: "/timeline", label: "时间线" },
                { href: "/map", label: "庄子地理" }, { href: "/concordance", label: "词语索引" },
                { href: "/heatmap", label: "词频热图" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)] tracking-[0.1em] uppercase mb-3">工具</h4>
            <div className="space-y-2">
              {[
                { href: "/bookmarks", label: "我的收藏" }, { href: "/report", label: "阅读报告" },
                { href: "/cards", label: "名言卡片" }, { href: "/ask-zhuangzi", label: "问庄子" },
                { href: "/compare", label: "诸子对谈" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--border-light)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--text-muted)] tracking-wide">
            &copy; {new Date().getFullYear()} 莊子數位典藏 · 逍遥游于无何有之乡
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">以无为之姿，游无穷之境</p>
        </div>
      </div>
    </footer>
  );
}

function LayoutInner({ children }: { children: ReactNode }) {
  const { immersive } = useReadingMode();

  useEffect(() => { registerSW(); }, []);

  return (
    <>
      {!immersive && <Navigation />}
      {!immersive && <ReadingProgress />}
      {!immersive && <ChatWithZhuangzi />}
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

export function LayoutClient({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ReadingModeProvider>
        <ErrorBoundary>
          <LayoutInner>{children}</LayoutInner>
        </ErrorBoundary>
      </ReadingModeProvider>
    </ThemeProvider>
  );
}
