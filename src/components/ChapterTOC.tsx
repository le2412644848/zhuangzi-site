"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  label: string;
}

interface ChapterTOCProps {
  /** 目录条目（服务端已裁剪为 id + 短标题，避免整篇章节对象进 RSC 载荷） */
  items: TocItem[];
}

/**
 * 章节目录（右侧固定悬浮）。
 *
 * 章节页减重：props 从「整个 chapter 对象」收窄为「id + 短标签」数组 ——
 * 原实现把整篇章节（原文/译文/注疏全文）序列化进 RSC 载荷。
 * 沉浸模式隐藏由 CSS 完成（html.immersive-mode .chapter-toc），
 * 组件不再订阅任何全局状态。
 *
 * 短标签本身已带「N. 」前缀（服务端 `${i + 1}. ${原文…}`），
 * 组件不再叠加序号，避免出现「1. 1. 北冥有鱼」的重复编号（视觉复审 N4）。
 */
export default function ChapterTOC({ items }: ChapterTOCProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Track which passage is currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    items.forEach((p) => {
      const el = document.getElementById(`passage-${p.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length <= 1) return null;

  return (
    <div className={`chapter-toc hidden lg:block fixed right-4 top-24 z-30 transition-all ${collapsed ? "w-8" : "w-48"}`}>
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/95 backdrop-blur-sm shadow-lg overflow-hidden">
        {/* Header */}
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "展开章节目录" : "折叠章节目录"}
          className="w-full flex items-center justify-between px-3 py-2 border-b border-[var(--border-light)] cursor-pointer text-left bg-transparent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {!collapsed && (
            <span className="text-xs font-medium text-[var(--text-accent)] tracking-wider">目录</span>
          )}
          <span className="text-[10px] text-[var(--text-secondary)] ml-auto">
            {collapsed ? "☰" : "−"}
          </span>
        </button>

        {/* TOC items */}
        {!collapsed && (
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {items.map((p) => (
              <a
                key={p.id}
                href={`#passage-${p.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`passage-${p.id}`)?.scrollIntoView({ behavior: "smooth" });
                  history.replaceState(null, "", `#passage-${p.id}`);
                }}
                className={`block px-3 py-1.5 text-xs transition-colors border-l-2 ${
                  activeId === `passage-${p.id}`
                    ? "border-[var(--text-accent)] text-[var(--text-accent)] bg-[var(--hover-bg)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
