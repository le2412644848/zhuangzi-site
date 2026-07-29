"use client";

import { useState, useEffect } from "react";
import { chapters } from "@/data/chapters";
import { getReadingHistory } from "@/components/ReadingHistory";
import Link from "next/link";

interface Stats {
  totalChapters: number;
  readChapters: string[];
  totalPassages: number;
  bookmarkedCount: number;
  annotatedCount: number;
  streak: number;
  lastReadDate: string | null;
}

export default function ReportPage() {
  const [stats, setStats] = useState<Stats>({
    totalChapters: chapters.length,
    readChapters: [],
    totalPassages: chapters.reduce((a, c) => a + c.passages.length, 0),
    bookmarkedCount: 0,
    annotatedCount: 0,
    streak: 0,
    lastReadDate: null,
  });

  useEffect(() => {
    const history = getReadingHistory();
    const readIds = new Set(history.map((h) => h.chapterId));

    let bmCount = 0;
    try {
      const raw = localStorage.getItem("bookmarks");
      if (raw) bmCount = JSON.parse(raw).length;
    } catch {}

    let annCount = 0;
    try {
      const raw = localStorage.getItem("annotations");
      if (raw) annCount = Object.keys(JSON.parse(raw)).length;
    } catch {}

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timestamps = history
      .map((h) => {
        const d = new Date(h.timestamp);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
      .sort((a, b) => b - a);

    if (timestamps.length > 0) {
      let checkDate = today.getTime();
      for (const ts of timestamps) {
        if (ts === checkDate) {
          streak++;
          checkDate -= 86400000;
        } else if (ts < checkDate) {
          break;
        }
      }
      if (timestamps[0] !== today.getTime()) {
        streak = 0;
      }
    }

    setStats({
      totalChapters: chapters.length,
      readChapters: [...readIds],
      totalPassages: chapters.reduce((a, c) => a + c.passages.length, 0),
      bookmarkedCount: bmCount,
      annotatedCount: annCount,
      streak,
      lastReadDate: history[0]
        ? new Date(history[0].timestamp).toLocaleDateString("zh-CN")
        : null,
    });
  }, []);

  const readPercent = Math.round(
    (stats.readChapters.length / stats.totalChapters) * 100
  );
  const unread = chapters.filter((ch) => !stats.readChapters.includes(ch.id));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          阅读报告
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          你的阅读历程与数据统计
        </p>
        <div className="ink-divider" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label: "已读篇章", value: `${stats.readChapters.length}/${stats.totalChapters}`, sub: `${readPercent}%` },
          { label: "收藏段落", value: String(stats.bookmarkedCount), sub: "书签" },
          { label: "批注笔记", value: String(stats.annotatedCount), sub: "条" },
          { label: "连续阅读", value: `${stats.streak}`, sub: "天" },
        ].map((card) => (
          <div
            key={card.label}
            className="card p-5 text-center"
          >
            <div className="stat-number text-xl mb-1">{card.value}</div>
            <div className="text-[11px] font-medium text-[var(--text-secondary)]">
              {card.label}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card p-5 mb-10">
        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
          <span>阅读进度</span>
          <span className="font-medium">{readPercent}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--text-accent)] to-[var(--color-accent-gold)] transition-all duration-1000"
            style={{ width: `${readPercent}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {chapters.map((ch) => (
            <div
              key={ch.id}
              title={ch.title}
              className={`w-3 h-3 rounded-sm transition-colors ${
                stats.readChapters.includes(ch.id)
                  ? "bg-[var(--text-accent)]"
                  : "bg-[var(--border-light)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Unread chapters */}
      {unread.length > 0 && (
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            未读篇章 ({unread.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {unread.map((ch) => (
              <Link
                key={ch.id}
                href={`/chapters/${ch.id}`}
                className="tag hover:border-[var(--text-accent)] hover:text-[var(--text-accent)] hover:bg-[var(--hover-bg)] cursor-pointer"
              >
                {ch.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Last read */}
      {stats.lastReadDate && (
        <div className="card p-5 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            最后一次阅读于{" "}
            <span className="text-[var(--text-accent)] font-medium">
              {stats.lastReadDate}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
