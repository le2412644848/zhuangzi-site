"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { search, type SearchResult } from "@/lib/search";
import SearchBar from "@/components/SearchBar";
import { Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setResults(search(initialQuery));
      setSearched(true);
    }
  }, [initialQuery]);

  // Extract snippet around the matched keyword
  const getSnippet = (text: string, q: string, maxLen = 120) => {
    if (!q.trim()) return text.slice(0, maxLen);
    const idx = text.indexOf(q);
    if (idx === -1) return text.slice(0, maxLen);
    const half = Math.floor(maxLen / 2);
    const start = Math.max(0, idx - half);
    const end = Math.min(text.length, idx + q.length + half);
    let snippet = text.slice(start, end);
    if (start > 0) snippet = "…" + snippet;
    if (end < text.length) snippet = snippet + "…";
    return snippet;
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-[var(--text-accent)]/15 text-[var(--text-accent)] rounded px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case "original": return "原文";
      case "translation": return "译文";
      case "commentary": return "解读";
      default: return "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          全文搜索
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          搜索原文、译文与解读
        </p>
        <div className="ink-divider" />
      </div>

      <div className="mb-8 flex justify-center">
        <SearchBar compact />
      </div>

      {searched && (
        <div className="mb-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            {results.length === 0
              ? `未找到与「${initialQuery}」相关的内容`
              : `找到 ${results.length} 条与「${initialQuery}」相关的结果`}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, idx) => (
          <Link
            key={`${result.chapterId}-${result.passageId}-${idx}`}
            href={`/chapters/${result.chapterId}#passage-${result.passageId}`}
            className="card-interactive group block p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-[var(--text-accent)] tracking-wide">
                {result.chapterTitle}
              </span>
              <span className="tag">
                {getFieldLabel(result.matchField)}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-[1.9] tracking-wide font-serif mb-2">
              {highlightMatch(getSnippet(result.original, initialQuery), initialQuery)}
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
              {highlightMatch(result.translation, initialQuery)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-sm text-[var(--text-muted)] animate-pulse">正在加载搜索…</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
