"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { KaojuEntry } from "@/lib/kaoju-utils";

interface WordTooltipProps {
  term: string;
  text: string;
  children: React.ReactNode;
  /** 陈鼓应《今注今译》考据（训诂 + 历代注家），可空 */
  kaoju?: KaojuEntry | null;
}

export default function WordTooltip({ term, text, children, kaoju }: WordTooltipProps) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, below: false });
  const [showAll, setShowAll] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 客户端挂载标志，避免 SSR 阶段 createPortal 访问 document
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    setShow(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShow(false), 200);
  };

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // 视口顶部空间不足时向下弹出，避免 tooltip 被截断
      const below = rect.top < 170;
      setPosition({
        top: below ? rect.bottom + 8 : rect.top - 8,
        left: rect.left + rect.width / 2,
        below,
      });
    }
  };

  // Close on scroll
  useEffect(() => {
    const onScroll = () => setShow(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, []);

  const citations = kaoju?.citations ?? [];
  const visibleCites = showAll ? citations : citations.slice(0, 2);

  const tooltip = show && mounted ? (
    <div
      className="fixed z-[9999] w-72 sm:w-80 max-h-[70vh] overflow-y-auto p-3 rounded-xl shadow-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm leading-relaxed pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
        transform: position.below ? "translate(-50%, 0)" : "translate(-50%, -100%)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-[var(--border-color)] bg-[var(--bg-card)] ${
          position.below ? "-top-1 border-t-0 border-l-0" : "top-full -mt-px border-t-0 border-l-0"
        }`}
      />
      <div className="font-medium text-[var(--text-accent)] mb-1 text-xs tracking-wide">
        「{term}」
      </div>
      <div className="text-[var(--text-primary)] text-xs leading-relaxed"
        dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
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
                  onClick={(e) => { e.stopPropagation(); setShowAll(!showAll); }}
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
      <span
        ref={triggerRef}
        className="inline cursor-help group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setShow(!show)}
      >
        <span className="border-b-2 border-dotted border-[var(--text-accent)]/40 hover:border-[var(--text-accent)] transition-colors">
          {children}
        </span>
      </span>
      {tooltip && createPortal(tooltip, document.body)}
    </>
  );
}
