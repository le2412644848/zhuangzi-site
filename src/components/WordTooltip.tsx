"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface WordTooltipProps {
  term: string;
  text: string;
  children: React.ReactNode;
}

export default function WordTooltip({ term, text, children }: WordTooltipProps) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

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
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
  };

  // Close on scroll
  useEffect(() => {
    const onScroll = () => setShow(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, []);

  const tooltip = show && mounted ? (
    <div
      className="fixed z-[9999] w-72 sm:w-80 p-3 rounded-xl shadow-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm leading-relaxed pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -100%)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-[var(--border-color)] bg-[var(--bg-card)] -mt-px" />
      <div className="font-medium text-[var(--text-accent)] mb-1 text-xs tracking-wide">
        「{term}」
      </div>
      <div className="text-[var(--text-primary)] text-xs leading-relaxed"
        dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
      />
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
