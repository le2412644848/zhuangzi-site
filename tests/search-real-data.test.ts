/**
 * 真实语料上的「只搜原文」回归测试。
 *
 * 用户要求：搜索只命中原文，译文/注疏不参与匹配。
 * 用真实 33 篇数据验证：取每段的译文/注疏中的代表性短语，
 * 确认原文不含时搜索零命中；原文高频词应正常命中。
 */
import { describe, expect, it } from "vitest";

import { chapters } from "@/data/chapters";
import { matchItems, buildGrams, type SearchItem } from "@/lib/search";

/** 与 ensureIndex 完全一致的索引构建（searchText 仅原文） */
function buildRealIndex(): SearchItem[] {
  return chapters.flatMap((ch) =>
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
      searchText: p.original,
    }))
  );
}

const index = buildRealIndex();

describe("真实语料：只搜原文", () => {
  it("译文中的词只可能命中原文真含该词的段落", () => {
    // 从译文/注疏取 gram，断言：凡是命中的段落，其原文必然包含该词
    // （「只搜原文」的语义 = 搜索范围只有原文；译文词若恰好在某段
    // 原文中也出现，命中该段是正确行为）
    const probes: string[] = [];
    for (const ch of chapters) {
      for (const p of ch.passages) {
        for (const g of buildGrams(p.translation).slice(0, 10)) {
          if (!probes.includes(g)) probes.push(g);
          if (probes.length >= 12) break;
        }
        if (probes.length >= 12) break;
      }
      if (probes.length >= 12) break;
    }
    expect(probes.length).toBeGreaterThanOrEqual(8);
    for (const q of probes) {
      for (const hit of matchItems(index, q)) {
        expect(
          hit.item.original.includes(q),
          `「${q}」命中的 ${hit.item.passageId} 原文必须包含该词`
        ).toBe(true);
      }
    }
  });

  it("注疏中的词只可能命中原文真含该词的段落", () => {
    const probes: string[] = [];
    for (const ch of chapters) {
      for (const p of ch.passages) {
        if (!p.commentary) continue;
        for (const g of buildGrams(p.commentary).slice(0, 10)) {
          if (!probes.includes(g)) probes.push(g);
          if (probes.length >= 8) break;
        }
        if (probes.length >= 8) break;
      }
      if (probes.length >= 8) break;
    }
    expect(probes.length).toBeGreaterThanOrEqual(5);
    for (const q of probes) {
      for (const hit of matchItems(index, q)) {
        expect(
          hit.item.original.includes(q),
          `「${q}」命中的 ${hit.item.passageId} 原文必须包含该词`
        ).toBe(true);
      }
    }
  });

  it("原文词正常命中且结果段落确实含该词", () => {
    for (const q of ["逍遥", "吾丧我", "庖丁", "大美", "朝菌"]) {
      const r = matchItems(index, q);
      expect(r.length, `「${q}」应在原文中命中`).toBeGreaterThan(0);
      for (const hit of r) {
        expect(
          hit.item.original.includes(q),
          `命中段 ${hit.item.passageId} 的原文应包含「${q}」`
        ).toBe(true);
      }
    }
  });
});
