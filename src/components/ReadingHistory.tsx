"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HistoryItem {
  chapterId: string;
  chapterTitle: string;
  timestamp: number;
  progress: number;
}

const STORAGE_KEY = "reading_history";
const MAX_ITEMS = 10;

export function recordReading(chapterId: string, chapterTitle: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history: HistoryItem[] = raw ? JSON.parse(raw) : [];
    const filtered = history.filter((h) => h.chapterId !== chapterId);
    filtered.unshift({
      chapterId,
      chapterTitle,
      timestamp: Date.now(),
      progress: 100,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
    // 通知已挂载的 ReadingHistoryWidget 刷新（此前监听器是死代码）
    window.dispatchEvent(new Event("reading-recorded"));
  } catch {}
}

export function getReadingHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function ReadingHistoryWidget() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(getReadingHistory());
    const handler = () => setHistory(getReadingHistory());
    window.addEventListener("reading-recorded", handler);
    return () => window.removeEventListener("reading-recorded", handler);
  }, []);

  if (history.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8 mb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-accent)] tracking-[0.08em]">
            最近阅读
          </h3>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setHistory([]);
            }}
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            清除记录
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {history.slice(0, 6).map((item) => (
            <Link
              key={`${item.chapterId}-${item.timestamp}`}
              href={`/chapters/${item.chapterId}`}
              className="tag hover:border-[var(--text-accent)] hover:text-[var(--text-accent)] hover:bg-[var(--hover-bg)] transition-all cursor-pointer py-1.5 px-3 text-xs"
            >
              {item.chapterTitle}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
