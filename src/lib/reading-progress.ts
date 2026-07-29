/**
 * Reading progress persistence — save/restore scroll position per chapter.
 * Uses localStorage so progress survives page refreshes and tab closes.
 */

const STORAGE_KEY = "zhuangzi-reading-progress";

interface ProgressEntry {
  chapterId: string;
  chapterTitle: string;
  passageId: string;
  scrollTop: number;
  timestamp: number;
}

function getAll(): Record<string, ProgressEntry> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Save current reading position */
export function saveProgress(chapterId: string, chapterTitle: string, passageId: string) {
  const all = getAll();
  all[chapterId] = {
    chapterId,
    chapterTitle,
    passageId,
    scrollTop: window.scrollY,
    timestamp: Date.now(),
  };
  // Keep only last 20 entries to avoid bloat
  const keys = Object.keys(all).sort((a, b) => all[b].timestamp - all[a].timestamp);
  const trimmed: Record<string, ProgressEntry> = {};
  for (const k of keys.slice(0, 20)) {
    trimmed[k] = all[k];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full — ignore
  }
}

/** Get last reading position for a chapter */
export function getProgress(chapterId: string): ProgressEntry | null {
  const all = getAll();
  return all[chapterId] || null;
}

/** Restore scroll position for a chapter. Call after DOM is ready. */
export function restoreProgress(chapterId: string) {
  const entry = getProgress(chapterId);
  if (!entry || !entry.passageId) return;

  // Try scrolling to the passage anchor first
  const el = document.getElementById(`passage-${entry.passageId}`);
  if (el) {
    el.scrollIntoView({ behavior: "instant", block: "start" });
    return;
  }

  // Fallback to saved scroll position
  if (entry.scrollTop > 0) {
    window.scrollTo({ top: entry.scrollTop, behavior: "instant" });
  }
}

/** Get all reading progress entries, sorted by most recent */
export function getAllProgress(): ProgressEntry[] {
  const all = getAll();
  return Object.values(all).sort((a, b) => b.timestamp - a.timestamp);
}

/** Get reading stats */
export function getReadingStats() {
  const all = Object.values(getAll());
  const uniqueChapters = new Set(all.map((e) => e.chapterId));
  return {
    chaptersRead: uniqueChapters.size,
    lastRead: all.length > 0 ? all[0] : null,
    totalEntries: all.length,
  };
}
