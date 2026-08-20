"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBookmarks, type Bookmark } from "@/lib/annotations";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    // 挂载后读 localStorage 收藏（hydration-safe）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookmarks(getBookmarks());
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          我的收藏
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          共 {bookmarks.length} 段收藏
        </p>
        <div className="ink-divider" />
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">📑</div>
          <p className="text-sm text-[var(--text-secondary)] mb-2">暂无收藏</p>
          <p className="text-xs text-[var(--text-muted)]">
            在阅读页面点击段落右上角的星标即可收藏
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((b) => (
            <Link
              key={`${b.chapterId}-${b.passageId}`}
              href={`/chapters/${b.chapterId}`}
              className="card-interactive group block p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-accent)] tracking-[0.06em]">
                  {b.chapterTitle}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {new Date(b.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-[1.9] tracking-wide font-serif">
                {b.preview}…
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
