"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import quotesData from "@/data/quotes.json";

const themes = [
  "全部", "逍遥自由", "认知局限", "生死观", "处世智慧",
  "无用之用", "自然无为", "齐物平等", "养生之道", "批判仁义",
];

interface Quote {
  id: string;
  text: string;
  chapter: string;
  chapterId: string;
  passageId: string;
  theme: string;
  explanation: string;
}

export default function QuotesPage() {
  const [theme, setTheme] = useState("全部");
  const quotes = useMemo(() => {
    const all = (quotesData as { quotes: Quote[] }).quotes;
    if (theme === "全部") return all;
    return all.filter((q) => q.theme === theme);
  }, [theme]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          名句精选
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          按主题分类，品味庄子哲思
        </p>
        <div className="ink-divider" />
      </div>

      {/* Theme filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {themes.map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
              theme === t
                ? "bg-[var(--text-accent)] text-white border-[var(--text-accent)] font-medium"
                : "tag text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mb-8">
        共 {quotes.length} 句
      </p>

      {/* Quotes list */}
      <div className="space-y-4">
        {quotes.map((q) => (
          <div
            key={q.id}
            className="card p-5 sm:p-6 hover:-translate-y-0.5 transition-transform"
          >
            <Link
              href={`/chapters/${q.chapterId}`}
              className="text-xs font-medium text-[var(--text-accent)] tracking-[0.06em] mb-3 inline-block hover:text-[var(--color-accent-deep)] transition-colors"
            >
              {q.chapter}
            </Link>
            <blockquote className="text-sm sm:text-base text-[var(--text-primary)] leading-[1.9] tracking-wide font-serif mb-3">
              &ldquo;{q.text}&rdquo;
            </blockquote>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {q.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
