"use client";

import { useEffect, useState } from "react";

export interface Annotation {
  passageId: string;
  chapterId: string;
  text: string;
  createdAt: number;
}

const STORAGE_KEY = "zhuangzi-annotations";

export function getAnnotations(): Record<string, Annotation> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveAnnotation(
  chapterId: string,
  passageId: string,
  text: string
) {
  const annotations = getAnnotations();
  const key = `${chapterId}::${passageId}`;
  annotations[key] = {
    passageId,
    chapterId,
    text,
    createdAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
  return annotations[key];
}

export function deleteAnnotation(chapterId: string, passageId: string) {
  const annotations = getAnnotations();
  const key = `${chapterId}::${passageId}`;
  delete annotations[key];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
}

export function getAnnotation(chapterId: string, passageId: string): Annotation | null {
  const annotations = getAnnotations();
  const key = `${chapterId}::${passageId}`;
  return annotations[key] || null;
}

/** React hook for annotations */
export function useAnnotation(chapterId: string, passageId: string) {
  const [annotation, setAnnotation] = useState<Annotation | null>(null);

  useEffect(() => {
    // 挂载后读 localStorage 初始化（hydration-safe）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnnotation(getAnnotation(chapterId, passageId));
  }, [chapterId, passageId]);

  const save = (text: string) => {
    const result = saveAnnotation(chapterId, passageId, text);
    setAnnotation(result);
  };

  const remove = () => {
    deleteAnnotation(chapterId, passageId);
    setAnnotation(null);
  };

  return { annotation, save, remove };
}

/** Export all annotations as a shareable JSON string */
export function exportAnnotations(): string {
  return JSON.stringify(getAnnotations());
}

/** Import annotations from a JSON string */
export function importAnnotations(json: string): number {
  try {
    const data = JSON.parse(json);
    const existing = getAnnotations();
    let count = 0;
    for (const [key, val] of Object.entries(data)) {
      if (!existing[key]) {
        existing[key] = val as Annotation;
        count++;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return count;
  } catch {
    return 0;
  }
}

/** Generate a shareable URL containing annotations for a specific passage */
export function getShareableAnnotationUrl(chapterId: string, passageId: string, text: string): string {
  const params = new URLSearchParams({
    ch: chapterId,
    p: passageId,
    a: text,
  });
  return `${window.location.origin}/annotations?${params.toString()}`;
}

/** Parse annotation from shared URL params */
export function parseSharedAnnotation(): { chapterId: string; passageId: string; text: string } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const ch = params.get("ch");
  const p = params.get("p");
  const a = params.get("a");
  if (ch && p && a) {
    return { chapterId: ch, passageId: p, text: a };
  }
  return null;
}

const BOOKMARK_KEY = "zhuangzi-bookmarks";

export interface Bookmark {
  chapterId: string;
  passageId: string;
  chapterTitle: string;
  preview: string;
  createdAt: number;
}

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(BOOKMARK_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(chapterId: string, passageId: string, chapterTitle: string, preview: string): boolean {
  const bookmarks = getBookmarks();
  const idx = bookmarks.findIndex((b) => b.chapterId === chapterId && b.passageId === passageId);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    return false; // removed
  } else {
    bookmarks.push({ chapterId, passageId, chapterTitle, preview: preview.slice(0, 100), createdAt: Date.now() });
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    return true; // added
  }
}

export function isBookmarked(chapterId: string, passageId: string): boolean {
  return getBookmarks().some((b) => b.chapterId === chapterId && b.passageId === passageId);
}

/** Import bookmarks from a JSON string（合并已存在的跳过，返回导入条数） */
export function importBookmarks(json: string): number {
  try {
    const data = JSON.parse(json) as Bookmark[];
    if (!Array.isArray(data)) return 0;
    const existing = getBookmarks();
    const known = new Set(existing.map((b) => `${b.chapterId}::${b.passageId}`));
    let count = 0;
    for (const b of data) {
      if (b && typeof b.chapterId === "string" && typeof b.passageId === "string" && !known.has(`${b.chapterId}::${b.passageId}`)) {
        existing.push(b);
        count++;
      }
    }
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(existing));
    return count;
  } catch {
    return 0;
  }
}

/** 一键导出批注 + 收藏（换设备/清缓存前的备份） */
export function exportUserData(): string {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    annotations: getAnnotations(),
    bookmarks: getBookmarks(),
  });
}

/** 导入 exportUserData 的产物，返回 { 批注, 收藏 } 各自新导入的条数 */
export function importUserData(json: string): { annotations: number; bookmarks: number } {
  try {
    const data = JSON.parse(json) as {
      annotations?: unknown;
      bookmarks?: unknown;
    };
    const annotations = data.annotations ? importAnnotations(JSON.stringify(data.annotations)) : 0;
    const bookmarks = data.bookmarks ? importBookmarks(JSON.stringify(data.bookmarks)) : 0;
    return { annotations, bookmarks };
  } catch {
    return { annotations: 0, bookmarks: 0 };
  }
}

/**
 * 导出带 YAML Frontmatter 的 Obsidian 兼容 Markdown 札记
 */
export function exportObsidianMarkdown(
  chapterTitleLookup: (id: string) => string
): string {
  const bookmarks = getBookmarks();
  const annotations = getAnnotations();
  const today = new Date().toISOString().slice(0, 10);

  const chapterIds = Array.from(
    new Set([
      ...bookmarks.map((b) => b.chapterId),
      ...Object.values(annotations).map((a) => a.chapterId),
    ])
  );

  let md = `---
title: 《南华全书》研读札记
date: ${today}
tags:
  - 庄子
  - 南华真经
  - 读书笔记
---

# 《南华全书》研读札记与藏修朱批

> 「乘天地之正，而御六气之辩，以游无穷者，彼且恶乎待哉！」
> 本札记由「《庄子》数字典藏 · 我的书斋」自动汇纂导出，兼容 Obsidian / Notion / Logseq 格式。

`;

  if (chapterIds.length === 0) {
    md += `*书斋暂无收藏或批注记录。*\n`;
    return md;
  }

  for (const chId of chapterIds) {
    const title = chapterTitleLookup(chId);
    const chBookmarks = bookmarks.filter((b) => b.chapterId === chId);
    const chAnnotations = Object.values(annotations).filter((a) => a.chapterId === chId);

    md += `\n## 《${title}》\n\n`;

    if (chBookmarks.length > 0) {
      md += `### 📌 妙句摘藏（${chBookmarks.length} 条）\n\n`;
      chBookmarks.forEach((b) => {
        const dateStr = new Date(b.createdAt).toLocaleDateString("zh-CN");
        md += `> ${b.preview}……\n\n`;
        md += `- 收藏于 ${dateStr} · [查阅原典段落](/chapters/${b.chapterId}#passage-${b.passageId})\n\n`;
      });
    }

    if (chAnnotations.length > 0) {
      md += `### ✍️ 朱笔眉批（${chAnnotations.length} 条）\n\n`;
      chAnnotations.forEach((a) => {
        const dateStr = new Date(a.createdAt).toLocaleDateString("zh-CN");
        md += `- **节次批注**（${dateStr}） · [定位原典](/chapters/${a.chapterId}#passage-${a.passageId})：\n`;
        md += `  > ${a.text}\n\n`;
      });
    }
  }

  return md;
}

/** 跨端同步码前缀 */
export const SYNC_CODE_PREFIX = "ZZSYNC1:";

function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function base64ToUtf8(b64: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(b64), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

/**
 * 将 bookmarks、annotations 以及 reading history 打包为零后端跨端同步码
 */
export function encodeSyncCode(): string {
  if (typeof window === "undefined") return "";
  try {
    const bookmarks = getBookmarks();
    const annotations = getAnnotations();
    let history: unknown = null;
    try {
      const raw =
        localStorage.getItem("zhuangzi-reading-history") ||
        localStorage.getItem("reading_history");
      if (raw) history = JSON.parse(raw);
    } catch {}

    const payload = {
      v: 1,
      t: Date.now(),
      bm: bookmarks,
      an: annotations,
      hi: history,
    };
    const json = JSON.stringify(payload);
    return `${SYNC_CODE_PREFIX}${utf8ToBase64(json)}`;
  } catch {
    return "";
  }
}

/**
 * 解码并合并跨端同步码，自动合入 bookmarks、annotations 与 reading history
 */
export function decodeAndImportSyncCode(
  code: string
): { bookmarks: number; annotations: number; chaptersRead: number } | null {
  if (typeof window === "undefined") return null;
  try {
    let cleanCode = code.trim();
    if (cleanCode.startsWith(SYNC_CODE_PREFIX)) {
      cleanCode = cleanCode.slice(SYNC_CODE_PREFIX.length);
    }
    const json = base64ToUtf8(cleanCode);
    const data = JSON.parse(json);

    let bookmarksCount = 0;
    let annotationsCount = 0;

    if (data.bm) {
      bookmarksCount = importBookmarks(JSON.stringify(data.bm));
    }
    if (data.an) {
      annotationsCount = importAnnotations(JSON.stringify(data.an));
    }

    // 合并阅读印谱/历史
    let chaptersReadCount = 0;
    if (data.hi && Array.isArray(data.hi)) {
      try {
        const curRaw =
          localStorage.getItem("zhuangzi-reading-history") ||
          localStorage.getItem("reading_history");
        const curList: Array<{ chapterId: string; [key: string]: unknown }> = curRaw
          ? JSON.parse(curRaw)
          : [];
        const seen = new Set(curList.map((item) => item.chapterId));

        for (const item of data.hi) {
          if (item && item.chapterId && !seen.has(item.chapterId)) {
            curList.push(item);
            seen.add(item.chapterId);
          }
        }
        localStorage.setItem("zhuangzi-reading-history", JSON.stringify(curList));
        localStorage.setItem("reading_history", JSON.stringify(curList));
        chaptersReadCount = seen.size;
      } catch {}
    } else {
      try {
        const curRaw =
          localStorage.getItem("zhuangzi-reading-history") ||
          localStorage.getItem("reading_history");
        if (curRaw) {
          const list = JSON.parse(curRaw);
          if (Array.isArray(list)) chaptersReadCount = list.length;
        }
      } catch {}
    }

    return {
      bookmarks: bookmarksCount,
      annotations: annotationsCount,
      chaptersRead: chaptersReadCount,
    };
  } catch {
    return null;
  }
}
