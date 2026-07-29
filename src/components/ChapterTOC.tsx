"use client";

import { useState, useEffect } from "react";
import type { Chapter } from "@/lib/chapters";
import { useReadingMode } from "./ReadingModeProvider";

export default function ChapterTOC({ chapter }: { chapter: Chapter }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { immersive } = useReadingMode();

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

    chapter.passages.forEach((p) => {
      const el = document.getElementById(`passage-${p.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [chapter.passages]);

  if (chapter.passages.length <= 1) return null;
  if (immersive) return null;

  return (
    <div className={`fixed right-4 top-24 z-30 transition-all ${collapsed ? "w-8" : "w-48"}`}>
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/95 backdrop-blur-sm shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-light)] cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}>
          {!collapsed && (
            <span className="text-xs font-medium text-[var(--text-accent)] tracking-wider">目录</span>
          )}
          <span className="text-[10px] text-[var(--text-secondary)]">
            {collapsed ? "☰" : "−"}
          </span>
        </div>

        {/* TOC items */}
        {!collapsed && (
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {chapter.passages.map((p, i) => (
              <a
                key={p.id}
                href={`#passage-${p.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`passage-${p.id}`)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`block px-3 py-1.5 text-xs transition-colors border-l-2 ${
                  activeId === `passage-${p.id}`
                    ? "border-[var(--text-accent)] text-[var(--text-accent)] bg-[var(--hover-bg)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                }`}
              >
                <span className="text-[10px] mr-1 text-[var(--text-secondary)]">{i + 1}.</span>
                {p.original.slice(0, 12)}{p.original.length > 12 ? "…" : ""}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
