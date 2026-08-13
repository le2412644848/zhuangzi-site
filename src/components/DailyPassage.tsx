"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { chaptersMeta } from "@/data/chapters/metadata";
import type { Chapter, Passage } from "@/lib/chapters";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function todaySeed(): number {
  const today = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < today.length; i++) {
    seed = ((seed << 5) - seed) + today.charCodeAt(i);
    seed = seed & seed;
  }
  return Math.abs(seed);
}

export default function DailyPassage() {
  const [daily, setDaily] = useState<{ chapterTitle: string; chapterId: string; passage: Passage } | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const rng = seededRandom(todaySeed());

      // Pick chapter deterministically, then a passage within it
      const chapterMeta = chaptersMeta[Math.floor(rng() * chaptersMeta.length)];

      // Dynamic import only the chapter we need
      const fullChapter = (await import(
        `@/data/chapters/${chapterMeta.id}.json`
      )) as unknown as Chapter;

      if (cancelled) return;

      const passage = fullChapter.passages[Math.floor(rng() * fullChapter.passages.length)];

      setDaily({
        chapterTitle: fullChapter.title,
        chapterId: fullChapter.id,
        passage,
      });
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (!daily) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8 mb-20">
      <div className="max-w-xl mx-auto">
        <div className="card p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative accent line */}
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--text-accent)]/30 via-[var(--color-accent-gold)]/20 to-transparent" />

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[var(--text-accent)] tracking-[0.12em] uppercase">
              每日一庄
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {new Date().toLocaleDateString("zh-CN", {
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <blockquote className="text-sm sm:text-base text-[var(--text-primary)] leading-[1.9] tracking-wide font-serif mb-4">
            &ldquo;{daily.passage.original.slice(0, 160)}
            {daily.passage.original.length > 160 ? "…" : ""}&rdquo;
          </blockquote>

          {showTranslation && (
            <div className="mb-4 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)]">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] italic leading-relaxed">
                {daily.passage.translation.slice(0, 140)}
                {daily.passage.translation.length > 140 ? "…" : ""}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="text-xs font-medium text-[var(--text-accent)] hover:text-[var(--color-accent-deep)] transition-colors"
            >
              {showTranslation ? "收起译文" : "查看白话译文"}
            </button>
            <Link
              href={`/chapters/${daily.chapterId}`}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-accent)] transition-colors flex items-center gap-1"
            >
              {daily.chapterTitle} · 阅读全文
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
