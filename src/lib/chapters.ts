import { chapters } from "@/data/chapters";

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

/** Get the next and previous chapter for navigation */
export function getAdjacentChapters(id: string): {
  prev: Chapter | null;
  next: Chapter | null;
} {
  const index = chapters.findIndex((c) => c.id === id);
  return {
    prev: index > 0 ? chapters[index - 1] : null,
    next: index < chapters.length - 1 ? chapters[index + 1] : null,
  };
}
