import { type ChapterMeta,chaptersMeta } from "@/data/chapters/metadata";

export interface Chapter {
  id: string;
  title: string;
  category: string;
  order: number;
  summary: string;
  conclusion?: string;
  /** 陈鼓应《今注今译》篇首题解 */
  intro?: string;
  passages: Passage[];
}

export interface WordAnnotation {
  term: string;
  text: string;
}

export interface TranslationEntry {
  translator: string;
  text: string;
}

export interface Passage {
  id: string;
  original: string;
  translation: string;
  commentary?: string;
  annotations?: WordAnnotation[];
  concepts: string[];
  translations?: TranslationEntry[];
}

export interface Concept {
  id: string;
  name: string;
  summary: string;
  description?: string;
  relatedChapters: string[];
  relatedConcepts: string[];
}

/** Get the next and previous chapter for navigation (lightweight — uses metadata only) */
export function getAdjacentChapters(id: string): {
  prev: ChapterMeta | null;
  next: ChapterMeta | null;
} {
  const index = chaptersMeta.findIndex((c) => c.id === id);
  return {
    prev: index > 0 ? (chaptersMeta[index - 1] ?? null) : null,
    next: index >= 0 && index < chaptersMeta.length - 1 ? (chaptersMeta[index + 1] ?? null) : null,
  };
}

/**
 * 入门首选篇目（对标古诗文网「选本」入口，降低 33 选 1 的选择成本）。
 * 取四篇最具代表性、篇幅适中的名篇：逍遥游（开篇立境）、
 * 齐物论（核心认识论）、养生主（最易入门）、秋水（外篇翘楚）。
 */
export const STARTER_CHAPTER_IDS: ReadonlySet<string> = new Set([
  "01-xiaoyao-you",
  "02-qiwu-lun",
  "03-yangsheng-zhu",
  "17-qiushui",
]);
