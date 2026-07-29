"use client";

import { useState, useEffect } from "react";

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
