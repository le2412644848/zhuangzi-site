"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { passageNumber } from "@/data/chapters/metadata";

interface Occurrence {
  chapterId: string;
  passageId: string;
}
interface WordEntry {
  word: string;
  count: number;
  occurrences: Occurrence[];
}

const chapterNames: Record<string, string> = {
  "01-xiaoyao-you": "逍遥游", "02-qiwu-lun": "齐物论", "03-yangsheng-zhu": "养生主",
  "04-renjian-shi": "人间世", "05-dechong-fu": "德充符", "06-dazong-shi": "大宗师",
  "07-yingdi-wang": "应帝王", "08-pianmu": "骈拇", "09-mati": "马蹄",
  "10-quqie": "胠箧", "11-zaiyou": "在宥", "12-tiandi": "天地", "13-tiandao": "天道",
  "14-tianyun": "天运", "15-keyi": "刻意", "16-shanxing": "缮性", "17-qiushui": "秋水",
  "18-zhile": "至乐", "19-dasheng": "达生", "20-shanmu": "山木", "21-tianzifang": "田子方",
  "22-zhibeiyou": "知北游", "23-gengsangchu": "庚桑楚", "24-xuwugui": "徐无鬼",
  "25-zeyang": "则阳", "26-waiwu": "外物", "27-yuyan": "寓言", "28-rangwang": "让王",
  "29-daozhi": "盗跖", "30-shuojian": "说剑", "31-yufu": "渔父", "32-lieyukou": "列御寇",
  "33-tianxia": "天下",
};

export default function ConcordancePage() {
  const [allWords, setAllWords] = useState<WordEntry[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    import("@/data/concordance.json").then((m) => {
      setAllWords((m.default as { words: WordEntry[] }).words);
    });
  }, []);

  const words = useMemo(() => {
    if (!search.trim()) return allWords.slice(0, 50);
    return allWords.filter((w) => w.word.includes(search));
  }, [allWords, search]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          词语索引
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {allWords.length > 0 ? `${allWords.length} 个词 · 全文检索分布` : "加载中…"}
        </p>
        <div className="ink-divider" />
      </div>

      {/* Search input */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索词语…"
        className="w-full mb-8 px-4 py-3 text-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]/20 focus:border-[var(--text-accent)]/40 transition-all shadow-sm"
      />

      {/* Loading state */}
      {allWords.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--text-muted)] animate-pulse">正在加载词语数据…</p>
        </div>
      )}

      {/* Word list */}
      <div className="space-y-2">
        {words.map((w) => (
          <div
            key={w.word}
            className="card overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === w.word ? null : w.word)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[var(--hover-bg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {w.word}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {w.count} 次
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
                  expanded === w.word ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
            {expanded === w.word && (
              <div className="px-5 pb-4 space-y-1 border-t border-[var(--border-light)] pt-3">
                {w.occurrences.map((o, i) => (
                  <Link
                    key={i}
                    href={`/chapters/${o.chapterId}`}
                    className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] py-1 transition-colors"
                  >
                    <span className="chapter-badge text-[10px] w-5 h-5">
                      {Object.keys(chapterNames).indexOf(o.chapterId) + 1}
                    </span>
                    {chapterNames[o.chapterId] || o.chapterId}
                    <span className="text-[var(--text-muted)] text-[10px]">
                      · 第 {passageNumber(o.chapterId, o.passageId) ?? "?"} 节
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
