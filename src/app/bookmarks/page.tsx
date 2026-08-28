"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { chaptersMeta, passageNumber } from "@/data/chapters/metadata";
import { type Annotation,type Bookmark,deleteAnnotation,exportUserData,getAnnotations,getBookmarks,importUserData } from "@/lib/annotations";

type Tab = "bookmarks" | "annotations";

const chapterTitleOf = (chapterId: string): string =>
  chaptersMeta.find((c) => c.id === chapterId)?.title ?? chapterId;

export default function BookmarksPage() {
  const [tab, setTab] = useState<Tab>("bookmarks");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [annotations, setAnnotations] = useState<Record<string, Annotation>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 挂载后读 localStorage（hydration-safe）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookmarks(getBookmarks());
    setAnnotations(getAnnotations());
  }, []);

  const annotationList = useMemo(
    () =>
      Object.values(annotations).sort((a, b) => b.createdAt - a.createdAt),
    [annotations]
  );

  /** 公告条（导入结果/删除确认），3 秒自动消失 */
  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3000);
  };

  const handleExport = () => {
    const blob = new Blob([exportUserData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zhuangzi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("已导出备份文件");
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const { annotations: na, bookmarks: nb } = importUserData(text);
    setAnnotations(getAnnotations());
    setBookmarks(getBookmarks());
    flash(`导入完成：批注 ${na} 条、收藏 ${nb} 条（已存在的跳过）`);
  };

  const handleDeleteAnnotation = (chapterId: string, passageId: string) => {
    deleteAnnotation(chapterId, passageId);
    setAnnotations(getAnnotations());
    flash("已删除批注");
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "bookmarks", label: "收藏", count: bookmarks.length },
    { key: "annotations", label: "批注", count: annotationList.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          我的书斋
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          收藏与批注保存在本机浏览器中
        </p>
        <div className="ink-divider" />
      </div>

      {/* 数据安全：导出 / 导入（清缓存或换设备前先备份） */}
      <div className="flex items-center justify-between gap-3 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]" role="tablist" aria-label="收藏与批注">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                tab === t.key
                  ? "bg-[var(--hover-bg)] text-[var(--text-accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-[var(--text-muted)]">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-[var(--text-accent)]/40 transition-colors"
          >
            导出备份
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-[var(--text-accent)]/40 transition-colors"
          >
            导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* 操作公告（aria-live 供读屏播报） */}
      <p role="status" aria-live="polite" className="min-h-6 mb-4 text-xs text-[var(--text-accent)] text-center">
        {notice ?? ""}
      </p>

      {tab === "bookmarks" ? (
        bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4 opacity-40">
              <span className="seal-char-lg" aria-hidden="true">藏</span>
            </div>
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
                href={`/chapters/${b.chapterId}#passage-${b.passageId}`}
                className="card-interactive group block p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--text-accent)] tracking-[0.06em]">
                    {b.chapterTitle}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(b.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-primary)] leading-[1.9] tracking-wide font-serif">
                  {b.preview}…
                </p>
              </Link>
            ))}
          </div>
        )
      ) : annotationList.length === 0 ? (
        <div className="text-center py-20">
          <div className="mb-4 opacity-40">
            <span className="seal-char-lg" aria-hidden="true">齋</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-2">暂无批注</p>
          <p className="text-xs text-[var(--text-muted)]">
            在阅读页面点击段落工具条的笔形按钮即可写下批注
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {annotationList.map((a) => {
            const num = passageNumber(a.chapterId, a.passageId);
            return (
              <div key={`${a.chapterId}-${a.passageId}`} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <Link
                    href={`/chapters/${a.chapterId}#passage-${a.passageId}`}
                    className="text-xs font-semibold text-[var(--text-accent)] tracking-[0.06em] hover:text-[var(--color-accent-deep)] transition-colors"
                  >
                    {chapterTitleOf(a.chapterId)}
                    {num ? ` · 第${num}节` : ""} ↗
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(a.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                    <button
                      onClick={() => handleDeleteAnnotation(a.chapterId, a.passageId)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--color-accent-vermilion)] transition-colors"
                      aria-label={`删除「${chapterTitleOf(a.chapterId)}」的批注`}
                    >
                      删除
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-primary)] leading-[1.9] tracking-wide">
                  {a.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
