import { chaptersMeta, type ChapterMeta } from "@/data/chapters/metadata";

export interface Chapter {
  id: string;
  title: string;
  category: string;
  order: number;
  summary: string;
  conclusion?: string;
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
    prev: index > 0 ? chaptersMeta[index - 1] : null,
    next: index < chaptersMeta.length - 1 ? chaptersMeta[index + 1] : null,
  };
}
