"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Chapter } from "@/lib/chapters";

interface Adjacent {
  prev: Chapter | null;
  next: Chapter | null;
}

export default function ChapterNav({ prev, next }: Adjacent) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!prev && !next) return null;

  return (
    <>
      {/* Desktop: floating side buttons */}
      <div className={`fixed top-1/2 -translate-y-1/2 z-20 transition-all duration-500 hidden lg:block ${
        visible ? "opacity-100" : "opacity-0"
      }`}>
        {prev && (
          <Link href={`/chapters/${prev.id}`}
            className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col items-center p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-sm hover:border-[var(--text-accent)] hover:shadow-md transition-all group no-print">
            <span className="text-[10px] text-[var(--text-secondary)]">上一篇</span>
            <span className="text-xs font-medium text-[var(--text-accent)] mt-1 group-hover:underline">{prev.title}</span>
          </Link>
        )}
        {next && (
          <Link href={`/chapters/${next.id}`}
            className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col items-center p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-sm hover:border-[var(--text-accent)] hover:shadow-md transition-all group no-print">
            <span className="text-[10px] text-[var(--text-secondary)]">下一篇</span>
            <span className="text-xs font-medium text-[var(--text-accent)] mt-1 group-hover:underline">{next.title}</span>
          </Link>
        )}
      </div>

      {/* Mobile: bottom bar */}
      <div className="fixed bottom-16 left-0 right-0 z-20 flex justify-between px-4 lg:hidden no-print">
        {prev && (
          <Link href={`/chapters/${prev.id}`}
            className="px-4 py-2 text-xs rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]/95 backdrop-blur-sm text-[var(--text-secondary)] hover:text-[var(--text-accent)] shadow-lg">
            ← {prev.title}
          </Link>
        )}
        <div className="flex-1" />
        {next && (
          <Link href={`/chapters/${next.id}`}
            className="px-4 py-2 text-xs rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]/95 backdrop-blur-sm text-[var(--text-secondary)] hover:text-[var(--text-accent)] shadow-lg">
            {next.title} →
          </Link>
        )}
      </div>
    </>
  );
}
