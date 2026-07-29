import { chapters } from "@/data/chapters";
import { concepts } from "@/data/concepts";
import Fuse from "fuse.js";

export interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  chapterCategory: string;
  passageId: string;
  original: string;
  translation: string;
  commentary: string;
  matchField: string;
  score: number;
}

// Build flat search index once
const searchIndex = chapters.flatMap((ch) =>
  ch.passages.map((p, i) => ({
    chapterId: ch.id,
    chapterTitle: ch.title,
    chapterCategory: ch.category,
    passageId: p.id,
    index: i,
    original: p.original,
    translation: p.translation,
    commentary: p.commentary || "",
    concepts: p.concepts || [],
    searchText: `${p.original} ${p.translation} ${p.commentary || ""}`,
  }))
);

const fuse = new Fuse(searchIndex, {
  keys: [
    { name: "original", weight: 2 },
    { name: "translation", weight: 1 },
    { name: "commentary", weight: 1 },
  ],
  threshold: 0.4,
  minMatchCharLength: 1,
});

export interface SearchFilters {
  category?: string;
  concept?: string;
}

export function search(
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  if (!query.trim()) return [];

  let results = fuse.search(query);

  // Fallback: Fuse.js can miss single CJK chars — do direct includes match
  if (results.length === 0 && query.trim().length <= 2) {
    const q = query.trim();
    results = searchIndex
      .filter((item) => item.searchText.includes(q))
      .map((item) => ({ item, score: 0, refIndex: 0 }));
  }

  // Apply filters
  if (filters) {
    if (filters.category) {
      results = results.filter(
        (r) => r.item.chapterCategory === filters.category
      );
    }
    if (filters.concept) {
      results = results.filter((r) =>
        filters.concept && r.item.concepts.includes(filters.concept)
      );
    }
  }

  return results.slice(0, 50).map((r) => {
    const item = r.item;
    const matchedField = findMatchField(query, item);
    return {
      chapterId: item.chapterId,
      chapterTitle: item.chapterTitle,
      chapterCategory: item.chapterCategory,
      passageId: item.passageId,
      original: item.original,
      translation: item.translation,
      commentary: item.commentary,
      matchField: matchedField,
      score: r.score ?? 0,
    };
  });
}

function findMatchField(
  query: string,
  item: (typeof searchIndex)[0]
): string {
  const q = query.toLowerCase();
  if (item.original.toLowerCase().includes(q)) return "original";
  if (item.translation.toLowerCase().includes(q)) return "translation";
  return "commentary";
}

/** Get all unique chapter categories */
export function getCategories(): string[] {
  const cats = new Set(chapters.map((c) => c.category));
  return Array.from(cats);
}

/** Get all concepts for filter UI */
export function getConceptList() {
  return concepts.map((c) => ({ id: c.id, name: c.name }));
}
