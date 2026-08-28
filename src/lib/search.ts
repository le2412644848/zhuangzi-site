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

// ——— Lazy-init cache: only build when first search is triggered ———
export interface SearchItem {
  chapterId: string;
  chapterTitle: string;
  chapterCategory: string;
  passageId: string;
  index: number;
  original: string;
  translation: string;
  commentary: string;
  concepts: string[];
  searchText: string;
}

let _searchIndex: SearchItem[] | null = null;

async function ensureIndex(): Promise<{ searchIndex: SearchItem[] }> {
  if (_searchIndex) return { searchIndex: _searchIndex };

  // 全文数据(703KB)延迟到首次搜索时再加载，避免阻塞搜索页/问庄子页首屏
  const { chapters } = await import("@/data/chapters");

  _searchIndex = chapters.flatMap((ch) =>
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
      // 只索引原文：搜索命中正文本身，译文/注疏不参与匹配
      // （结果卡片仍展示对应译文，方便对照阅读）
      searchText: p.original,
    }))
  );

  return { searchIndex: _searchIndex };
}

/**
 * 查询 → 双字 gram 序列（去除标点与空白）。
 * 中文检索按「双字共现」匹配，比单字命中精准、比整串包含宽容。
 */
export function buildGrams(query: string): string[] {
  const clean = query.replace(/[\s\u3000，。、；：！？·—…""''“”‘’〈〉《》「」『』（）【】]/g, "");
  const grams: string[] = [];
  for (let i = 0; i < clean.length - 1; i++) {
    const g = clean.slice(i, i + 2);
    if (!grams.includes(g)) grams.push(g);
  }
  return grams;
}

/** 命中位置加分：越靠前分越高 */
function positionBonus(text: string, s: string): number {
  const idx = text.indexOf(s);
  return idx < 0 ? 0 : Math.max(0, 100 - Math.floor(idx / 50));
}

/**
 * 核心匹配（纯函数，可测试）：
 *  - 单字/双字查询：直接子串包含（fuse.js 对中文单字召回差的历史问题）
 *  - 三字及以上：要求每个双字 gram 都出现（AND 共现），按命中位置评分
 *  - 完整查询串连续命中者大幅加分（精确匹配优先）
 * 注：searchText 只含原文（见 ensureIndex），匹配天然限定在原文域。
 */
export function matchItems(
  items: SearchItem[],
  query: string
): { item: SearchItem; score: number }[] {
  const q = query.trim();
  if (!q) return [];
  const grams = buildGrams(q);
  const out: { item: SearchItem; score: number }[] = [];

  for (const item of items) {
    const text = item.searchText;

    // 无 gram（单字查询）：直接包含
    if (grams.length === 0) {
      if (text.includes(q)) {
        out.push({ item, score: 100 + positionBonus(text, q) });
      }
      continue;
    }

    // 多字查询：AND 共现 + 评分
    let score = 0;
    let all = true;
    for (const g of grams) {
      const idx = text.indexOf(g);
      if (idx < 0) {
        all = false;
        break;
      }
      score += positionBonus(text, g);
    }
    if (!all) continue;
    // 完整查询串连续命中：精确匹配优先
    if (text.includes(q)) score += 200;
    out.push({ item, score });
  }

  return out.sort((a, b) => b.score - a.score);
}

export interface SearchFilters {
  category?: string;
  concept?: string;
}

export async function search(
  query: string,
  filters?: SearchFilters
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const { searchIndex } = await ensureIndex();

  let results = matchItems(searchIndex, query);

  // Apply filters
  if (filters) {
    if (filters.category) {
      results = results.filter((r) => r.item.chapterCategory === filters.category);
    }
    if (filters.concept) {
      results = results.filter((r) => filters.concept && r.item.concepts.includes(filters.concept));
    }
  }

  return results.slice(0, 50).map((r) => {
    const item = r.item;
    return {
      chapterId: item.chapterId,
      chapterTitle: item.chapterTitle,
      chapterCategory: item.chapterCategory,
      passageId: item.passageId,
      original: item.original,
      translation: item.translation,
      commentary: item.commentary,
      // 搜索范围已收窄为原文，命中域恒为 original
      matchField: "original",
      score: r.score,
    };
  });
}
