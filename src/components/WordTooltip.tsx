"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { KaojuEntry } from "@/lib/kaoju-utils";
import { findKaoju } from "@/lib/kaoju-utils";
import { renderEmphasis } from "@/lib/markup";

interface WordTooltipProps {
  term: string;
  text: string;
  children: React.ReactNode;
  /** 所属篇 id —— 训诂数据按篇懒加载（/data/kaoju/<id>.json），不进首屏载荷 */
  chapterId: string;
  /**
   * 名句光晕：该词条与原文内嵌名句区间重叠时置 true —— 词条本身保持
   * tooltip 交互，仅叠加与 quote-mark 相同的高亮底色（按钮内不能嵌 <a>，
   * 跳转由名句的纯文本部分承担）。
   */
  quoteHalo?: boolean | undefined;
}

/** 篇级考据（陈鼓应词条）模块级缓存：每个篇只 fetch 一次 */
const kaojuCache = new Map<string, Promise<KaojuEntry[]>>();
function loadChapterKaoju(chapterId: string): Promise<KaojuEntry[]> {
  let p = kaojuCache.get(chapterId);
  if (!p) {
    p = fetch(`/data/kaoju/${chapterId}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.entries?.chen ?? [])
      .catch(() => []);
    kaojuCache.set(chapterId, p);
  }
  return p;
}

/**
 * 词语注释浮层 —— 全站阅读体验的核心交互。
 *
 * 原实现是 `<span onMouseEnter/onMouseLeave/onClick>`：没有 tabIndex、没有
 * role、没有键盘事件、没有 Escape 关闭、没有 aria 关联。后果是
 * 「键盘用户和屏幕阅读器用户完全无法获取逐字注」——对一个古籍注疏站来说，
 * 等于主要内容之一对这部分用户不存在。
 *
 * 本次修正对齐 WCAG 2.1：
 *  - 1.4.13 Content on Hover or Focus：可悬停、可聚焦触发，可 Esc 关闭，
 *    指针移入浮层本身不会关闭（原本有 200ms 宽限，保留）。
 *  - 2.1.1 Keyboard：改为真正的 <button>，Enter/Space 可切换。
 *  - 4.1.2 Name, Role, Value：aria-expanded / aria-describedby 关联浮层内容。
 *  - 触屏：原来 hover 不可用时只能靠 onClick 且无任何可见提示；现在按钮语义
 *    天然支持点击，并有 44px 最小触控高度（见 globals.css）。
 */
export default function WordTooltip({ term, text, children, chapterId, quoteHalo }: WordTooltipProps) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, below: false, arrowOffset: 0 });
  const [showAll, setShowAll] = useState(false);
  // undefined = 尚未加载；null = 已加载但无命中
  const [kaoju, setKaoju] = useState<KaojuEntry | null | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  // 首次打开时懒加载篇级考据并在客户端查找命中条目（findKaoju 是纯函数）。
  // 训诂内容因此不进首屏 HTML/RSC 载荷，只在需要时下载。
  useEffect(() => {
    if (!show || kaoju !== undefined) return;
    let cancelled = false;
    loadChapterKaoju(chapterId).then((entries) => {
      if (cancelled) return;
      setKaoju(findKaoju(entries, term));
    });
    return () => {
      cancelled = true;
    };
  }, [show, kaoju, chapterId, term]);

  useEffect(() => {
    // 客户端挂载标志，避免 SSR 阶段 createPortal 访问 document
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // 激活注词时派发自定义事件，供宽屏左侧「宋刻眉批笺注栏」实时响应联动
  useEffect(() => {
    if (!show) return;
    window.dispatchEvent(
      new CustomEvent("zhuangzi:focus-term", {
        detail: { term, explanation: text, chapterId },
      })
    );
  }, [show, term, text, chapterId]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const isVertical = document.documentElement.classList.contains("vertical-mode");

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    // 视口空间检查：在竖排模式下文字柱纵贯屏幕，rect.bottom 往往接近视口底部，
    // 若下方空间不足 220px（或竖排模式下不足 260px）必须强制向上弹出；
    // 上方空间不足 180px 且下方充足时向下弹出。
    let below = false;
    if (spaceBelow < 220 || (isVertical && spaceBelow < 260)) {
      below = false;
    } else if (spaceAbove < 180) {
      below = true;
    } else {
      below = false;
    }

    // 浮层宽 288px(w-72) 且以 translateX(-50%) 居中：靠近屏幕左右边缘的注释词
    // 会把浮层推出视口（375px 宽的手机上尤其明显）。
    // 这里把中心点夹紧到「半宽 + 8px 边距」的可用区间内。
    const half = Math.min(288, window.innerWidth - 16) / 2;
    const margin = 8;
    const centreX = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      Math.max(centreX, half + margin),
      window.innerWidth - half - margin
    );

    // 小三角相对于浮层中心的偏移量：让小三角始终精确指向触发词，不再在屏幕边缘悬空指空
    const arrowOffset = Math.max(-110, Math.min(110, centreX - clampedLeft));

    // 计算 top 并夹紧在 [12, window.innerHeight - 16] 安全区间内，彻底杜绝弹窗跌出屏幕底缘
    let top = below ? rect.bottom + 8 : rect.top - 8;
    top = Math.max(12, Math.min(window.innerHeight - 16, top));

    setPosition({
      top,
      left: clampedLeft,
      below,
      arrowOffset,
    });
  }, []);

  const open = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    setShow(true);
  }, [updatePosition]);

  /** 延迟关闭：允许指针从触发词移动到浮层上而不闪断 */
  const closeSoon = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(false), 200);
  }, []);

  const closeNow = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(false);
  }, []);

  // 滚动时关闭（浮层用 fixed 定位，不随内容滚动）
  useEffect(() => {
    if (!show) return;
    const onScroll = () => setShow(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [show]);

  // WCAG 1.4.13：Esc 必须能关闭浮层，且焦点回到触发元素
  useEffect(() => {
    if (!show) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeNow();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [show, closeNow]);

  // 卸载时清掉待执行的关闭定时器
  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const citations = kaoju?.citations ?? [];
  const visibleCites = showAll ? citations : citations.slice(0, 2);

  const tooltip = show && mounted ? (
    <div
      id={tooltipId}
      role="tooltip"
      className="fixed z-[9999] w-[min(18rem,calc(100vw-1rem))] sm:w-80 max-h-[70vh] overflow-y-auto p-3 rounded-xl shadow-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm leading-relaxed pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
        transform: position.below ? "translate(-50%, 0)" : "translate(-50%, -100%)",
      }}
      onMouseEnter={open}
      onMouseLeave={closeSoon}
    >
      <div
        className={`absolute -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-[var(--border-color)] bg-[var(--bg-card)] ${
          position.below ? "-top-1 border-t-0 border-l-0" : "top-full -mt-px border-t-0 border-l-0"
        }`}
        style={{ left: `calc(50% + ${position.arrowOffset}px)` }}
      />
      <div className="font-medium text-[var(--text-accent)] mb-1 text-xs tracking-wide">
        「{term}」
      </div>
      <div className="text-[var(--text-primary)] text-xs leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderEmphasis(text) }}
      />

      {kaoju && (kaoju.explanation || citations.length > 0) && (
        <div className="mt-2 pt-2 border-t border-[var(--border-light)]">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] tracking-[0.08em] mb-1">
            训诂 · 陈鼓应《今注今译》
          </div>
          {kaoju.explanation && (
            <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {kaoju.explanation}
            </div>
          )}
          {citations.length > 0 && (
            <div className="mt-1.5 space-y-1.5">
              {visibleCites.map((c, i) => (
                <div key={i} className="text-[11px] text-[var(--text-secondary)] leading-snug">
                  <span className="font-medium text-[var(--text-accent)]">{c.author}</span>
                  <span>：</span>
                  <span>{c.quote.length > 60 ? c.quote.slice(0, 60) + "…" : c.quote}</span>
                  {c.source && <span className="text-[var(--text-muted)]">（《{c.source}》）</span>}
                </div>
              ))}
              {citations.length > 2 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowAll(!showAll); }}
                  aria-expanded={showAll}
                  className="text-[11px] text-[var(--text-accent)] hover:underline"
                >
                  {showAll ? "收起" : `展开全部 ${citations.length} 家注`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      {/*
        用 <button> 而非 <span>：天然可聚焦、可 Enter/Space 触发、有正确 role。
        display:inline 保持在正文流中不破坏行距；文字仍继承正文字号。
      */}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={show}
        aria-describedby={show ? tooltipId : undefined}
        aria-label={`${term} — 查看注释`}
        className="inline cursor-help text-left font-[inherit] text-[inherit] leading-[inherit] bg-transparent p-0 border-0 align-baseline"
        onMouseEnter={open}
        onMouseLeave={closeSoon}
        onFocus={open}
        onBlur={closeSoon}
        onClick={() => (show ? closeNow() : open())}
      >
        <span
          className={`border-b-2 border-dotted border-[var(--text-accent)]/40 hover:border-[var(--text-accent)] focus-visible:border-[var(--text-accent)] transition-colors${quoteHalo ? " quote-halo" : ""}`}
        >
          {children}
        </span>
      </button>
      {tooltip && createPortal(tooltip, document.body)}
    </>
  );
}
