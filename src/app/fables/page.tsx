"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import fablesData from "@/data/fables.json";

interface Fable {
  id: string;
  name: string;
  chapter: string;
  chapterId: string;
  passageId: string;
  summary: string;
  moral: string;
  keywords: string[];
}

export default function FablesPage() {
  const [keyword, setKeyword] = useState("全部");
  const fables = useMemo(() => {
    const all = (fablesData as { fables: Fable[] }).fables;
    if (keyword === "全部") return all;
    return all.filter((f) => f.keywords.includes(keyword));
  }, [keyword]);

  const allKeywords = useMemo(() => {
    const all = (fablesData as { fables: Fable[] }).fables;
    const kws = new Set(all.flatMap((f) => f.keywords));
    return ["全部", ...Array.from(kws).sort()];
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          寓言索引
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          庄子寓言，汪洋恣肆，天马行空
        </p>
        <div className="ink-divider" />
      </div>

      {/* Keyword filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {allKeywords.map((k) => (
          <button
            key={k}
            onClick={() => setKeyword(k)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
              keyword === k
                ? "bg-[var(--text-accent)] text-white font-medium"
                : "tag text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mb-8">
        共 {(fablesData as { fables: Fable[] }).fables.length} 则寓言 · 筛选 {fables.length} 则
      </p>

      {/* Fables grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {fables.map((f) => (
          <Link
            key={f.id}
            href={`/chapters/${f.chapterId}`}
            className="card-interactive group p-5 flex flex-col gap-3"
          >
            <h3 className="text-base font-semibold text-[var(--text-accent)] tracking-wide group-hover:text-[var(--color-accent-deep)] transition-colors">
              {f.name}
            </h3>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed flex-1">
              {f.summary}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] pt-1">
              <span>{f.chapter}</span>
              <span className="opacity-30">·</span>
              <span className="italic">{f.moral}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
