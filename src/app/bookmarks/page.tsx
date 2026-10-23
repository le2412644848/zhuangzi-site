"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { chaptersMeta, passageNumber } from "@/data/chapters/metadata";
import {
  type Annotation,
  type Bookmark,
  decodeAndImportSyncCode,
  deleteAnnotation,
  encodeSyncCode,
  exportObsidianMarkdown,
  exportUserData,
  getAnnotations,
  getBookmarks,
  importUserData,
  toggleBookmark,
} from "@/lib/annotations";

type Tab = "bookmarks" | "annotations";

const chapterTitleOf = (chapterId: string): string =>
  chaptersMeta.find((c) => c.id === chapterId)?.title ?? chapterId;

export default function BookmarksPage() {
  const [tab, setTab] = useState<Tab>("bookmarks");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [annotations, setAnnotations] = useState<Record<string, Annotation>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [generatedSyncCode, setGeneratedSyncCode] = useState<string>("");
  const [inputSyncCode, setInputSyncCode] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  /** 公告条（导入结果/删除确认），3 秒自动消失 */
  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3500);
  };

  useEffect(() => {
    // 挂载后读 localStorage（hydration-safe）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookmarks(getBookmarks());
     
    setAnnotations(getAnnotations());

    // 自动检测 URL ?sync=... 跨端同步入参
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const syncQuery = params.get("sync");
      if (syncQuery) {
        const res = decodeAndImportSyncCode(syncQuery);
        if (res) {
           
          setBookmarks(getBookmarks());
           
          setAnnotations(getAnnotations());
          flash(`已自动合入同步数据：收藏 ${res.bookmarks} 条、批注 ${res.annotations} 条、研读章节 ${res.chaptersRead} 篇`);
          // 清理 URL 参数保持地址栏整洁
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    }
  }, []);

  const annotationList = useMemo(
    () =>
      Object.values(annotations).sort((a, b) => b.createdAt - a.createdAt),
    [annotations]
  );

  const handleExportJson = () => {
    const blob = new Blob([exportUserData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zhuangzi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("已导出 JSON 备份文件");
  };

  const handleExportObsidian = () => {
    const md = exportObsidianMarkdown(chapterTitleOf);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `南华全书-研读札记-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    flash("已导出 Obsidian 札记 (.md)");
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const { annotations: na, bookmarks: nb } = importUserData(text);
    setAnnotations(getAnnotations());
    setBookmarks(getBookmarks());
    flash(`导入完成：批注 ${na} 条、收藏 ${nb} 条（已存在的跳过）`);
  };

  const handleGenerateSyncCode = () => {
    const code = encodeSyncCode();
    setGeneratedSyncCode(code);
    flash("已生成本机同步码，可复制使用");
  };

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      flash(`已复制${label}到剪贴板`);
    });
  };

  const handleMergeSyncCode = () => {
    if (!inputSyncCode.trim()) {
      flash("请先粘贴书斋同步码");
      return;
    }
    const res = decodeAndImportSyncCode(inputSyncCode);
    if (!res) {
      flash("同步码格式无效，请确认无误后重试");
      return;
    }
    setAnnotations(getAnnotations());
    setBookmarks(getBookmarks());
    setInputSyncCode("");
    flash(`合入书斋成功：新增收藏 ${res.bookmarks} 条、批注 ${res.annotations} 条、研读记录 ${res.chaptersRead} 篇`);
  };

  const handleDeleteAnnotation = (chapterId: string, passageId: string) => {
    deleteAnnotation(chapterId, passageId);
    setAnnotations(getAnnotations());
    flash("已删除批注");
  };

  const handleRemoveBookmark = (b: Bookmark) => {
    toggleBookmark(b.chapterId, b.passageId, b.chapterTitle, b.preview);
    setBookmarks(getBookmarks());
    flash("已取消收藏段落");
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "bookmarks", label: "妙句摘藏", count: bookmarks.length },
    { key: "annotations", label: "朱笔眉批", count: annotationList.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* 头部引言 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif bg-[var(--text-accent)]/10 text-[var(--text-accent)] mb-3">
          <span className="seal-char" aria-hidden="true">齋</span>
          文人藏修之地
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-[0.04em] text-[var(--text-primary)] mb-2">
          我的书斋
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-serif">
          收藏金句与朱笔批注存录于本机浏览器中，支持零后端跨端瞬移与 Obsidian 札记导出
        </p>
        <div className="ink-divider max-w-xs mx-auto mt-4" />
      </div>

      {/* 数据安全与跨端工具栏 */}
      <div className="p-4 mb-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] shadow-xs"
            role="tablist"
            aria-label="收藏与批注"
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-serif transition-colors cursor-pointer ${
                  tab === t.key
                    ? "bg-[var(--bg-card)] text-[var(--text-accent)] font-semibold shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-xs text-[var(--text-muted)]">
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* 工具箱按钮群 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportObsidian}
              className="px-3 py-1.5 rounded-lg border border-[var(--text-accent)]/40 bg-[var(--text-accent)]/10 text-xs font-serif text-[var(--text-accent)] hover:bg-[var(--text-accent)]/20 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span className="seal-char" aria-hidden="true">記</span>
              导出 Obsidian 札记 (.md)
            </button>
            <button
              type="button"
              onClick={() => setShowSyncPanel((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--hover-bg)] text-xs font-serif text-[var(--text-primary)] transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span className="seal-char" aria-hidden="true">移</span>
              跨端同步码
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-serif text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-xs cursor-pointer"
            >
              备份 JSON
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-serif text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-xs cursor-pointer"
            >
              恢复
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

        {/* 展开的「跨端同步码（手机/电脑免登录瞬移）」面板 */}
        {showSyncPanel && (
          <div className="mt-4 pt-4 border-t border-[var(--border-light)] space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-serif font-semibold bg-[var(--text-accent)]/15 text-[var(--text-accent)]">
                零后端跨端瞬移
              </span>
              <span className="text-xs font-serif text-[var(--text-secondary)]">
                利用 Base64 编码在多设备间毫秒级转移您的书斋藏修（无需注册登录与云端存储）
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 左侧：从本机生成并复制 */}
              <div className="p-3.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-medium text-[var(--text-primary)]">
                    ① 生成本机同步码
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateSyncCode}
                    className="text-xs font-serif px-2.5 py-1 rounded bg-[var(--text-accent)] text-[var(--btn-accent-text,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    生成同步码
                  </button>
                </div>
                {generatedSyncCode ? (
                  <div className="space-y-2">
                    <textarea
                      readOnly
                      rows={3}
                      value={generatedSyncCode}
                      className="w-full text-[11px] font-mono p-2 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyText(generatedSyncCode, "同步码")}
                        className="text-xs font-serif px-2.5 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] hover:text-[var(--text-accent)] transition-colors cursor-pointer"
                      >
                        复制同步码
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname}?sync=${encodeURIComponent(
                            generatedSyncCode
                          )}`;
                          handleCopyText(url, "同步链接");
                        }}
                        className="text-xs font-serif px-2.5 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] hover:text-[var(--text-accent)] transition-colors cursor-pointer"
                      >
                        复制同步短链（发给手机）
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] font-serif">
                    点击右上角按钮即可打包当前设备的收藏与批注。
                  </p>
                )}
              </div>

              {/* 右侧：粘贴外设同步码合入 */}
              <div className="p-3.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] space-y-2.5">
                <span className="text-xs font-serif font-medium text-[var(--text-primary)]">
                  ② 粘贴外设同步码合入
                </span>
                <textarea
                  rows={3}
                  value={inputSyncCode}
                  onChange={(e) => setInputSyncCode(e.target.value)}
                  placeholder="在此粘贴由其他设备生成的 ZZSYNC1:... 同步码"
                  className="w-full text-[11px] font-mono p-2 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] resize-none placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={handleMergeSyncCode}
                  className="w-full text-xs font-serif py-1.5 rounded bg-[var(--color-accent-vermilion,#b83b2e)] text-[#ffffff] hover:opacity-90 transition-opacity font-medium shadow-xs cursor-pointer"
                >
                  合入书斋
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 操作公告 */}
      <p
        role="status"
        aria-live="polite"
        className="min-h-6 mb-4 text-xs font-serif text-[var(--text-accent)] text-center transition-opacity"
      >
        {notice ?? ""}
      </p>

      {/* 内容主体 */}
      {tab === "bookmarks" ? (
        bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4 opacity-40">
              <span className="seal-char-lg" aria-hidden="true">藏</span>
            </div>
            <p className="text-sm font-serif text-[var(--text-secondary)] mb-2">
              暂无收藏
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              在阅读页面点击段落右上角的星标即可将金句存入书斋
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b) => (
              <div
                key={`${b.chapterId}-${b.passageId}`}
                className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-accent)]/50 shadow-xs transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Link
                    href={`/chapters/${b.chapterId}#passage-${b.passageId}`}
                    className="text-xs font-semibold font-serif text-[var(--text-accent)] tracking-[0.06em] hover:underline flex items-center gap-1"
                  >
                    <span>《{b.chapterTitle}》</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">
                      展卷 ↗
                    </span>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)] font-serif">
                      {new Date(b.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBookmark(b)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--color-accent-vermilion,#b83b2e)] transition-colors cursor-pointer"
                      aria-label={`取消收藏「${b.chapterTitle}」的段落`}
                    >
                      取消收藏
                    </button>
                  </div>
                </div>
                <Link
                  href={`/chapters/${b.chapterId}#passage-${b.passageId}`}
                  className="block mt-2"
                >
                  <p className="text-sm text-[var(--text-primary)] leading-[1.9] tracking-wide font-serif hover:text-[var(--text-accent)] transition-colors">
                    {b.preview}…
                  </p>
                </Link>
              </div>
            ))}
          </div>
        )
      ) : annotationList.length === 0 ? (
        <div className="text-center py-20">
          <div className="mb-4 opacity-40">
            <span className="seal-char-lg" aria-hidden="true">註</span>
          </div>
          <p className="text-sm font-serif text-[var(--text-secondary)] mb-2">
            暂无批注
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            在阅读页面点击段落工具条的笔形按钮即可写下眉批札记
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {annotationList.map((a) => {
            const num = passageNumber(a.chapterId, a.passageId);
            return (
              <div
                key={`${a.chapterId}-${a.passageId}`}
                className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-accent)]/50 shadow-xs transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <Link
                    href={`/chapters/${a.chapterId}#passage-${a.passageId}`}
                    className="text-xs font-semibold font-serif text-[var(--text-accent)] tracking-[0.06em] hover:text-[var(--color-accent-deep)] transition-colors"
                  >
                    《{chapterTitleOf(a.chapterId)}》
                    {num ? ` · 第${num}节` : ""} ↗
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)] font-serif">
                      {new Date(a.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteAnnotation(a.chapterId, a.passageId)
                      }
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--color-accent-vermilion,#b83b2e)] transition-colors cursor-pointer"
                      aria-label={`删除「${chapterTitleOf(a.chapterId)}」的批注`}
                    >
                      删除
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-primary)] leading-[1.9] tracking-wide font-serif mt-2">
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
