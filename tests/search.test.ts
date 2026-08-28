/**
 * 全文检索匹配逻辑测试（TODO 3.14）。
 *
 * 旧实现 fuse.js（threshold 0.4）对中文单字/文言虚词召回排序差，
 * 现改为 bigram 共现 AND + 评分。这里用 mock 数据把匹配语义固化：
 *  - 单字/双字：直接包含
 *  - 三字及以上：每个双字 gram 都必须出现（AND）
 *  - 精确连续命中排最前
 *  - **只搜原文**：searchText 仅含原文，译文/注疏命中不召回
 */
import { describe, expect, it } from "vitest";

import { buildGrams, matchItems, type SearchItem } from "@/lib/search";

function item(partial: Partial<SearchItem> & { original: string }): SearchItem {
  const original = partial.original;
  return {
    chapterId: partial.chapterId ?? "01",
    chapterTitle: partial.chapterTitle ?? "篇",
    chapterCategory: partial.chapterCategory ?? "内篇",
    passageId: partial.passageId ?? "p1",
    index: partial.index ?? 0,
    original,
    translation: partial.translation ?? "",
    commentary: partial.commentary ?? "",
    concepts: partial.concepts ?? [],
    // 与 ensureIndex 一致：只索引原文
    searchText: original,
  };
}

describe("buildGrams", () => {
  it("生成双字 gram 并去重", () => {
    expect(buildGrams("庄周梦蝶")).toEqual(["庄周", "周梦", "梦蝶"]);
  });
  it("过滤标点与空白", () => {
    expect(buildGrams("北冥有鱼，其名为鲲")).toEqual(["北冥", "冥有", "有鱼", "鱼其", "其名", "名为", "为鲲"]);
  });
  it("单字查询无 gram", () => {
    expect(buildGrams("道")).toEqual([]);
  });
});

describe("matchItems", () => {
  const items = [
    item({ original: "北冥有鱼，其名为鲲。鲲之大，不知其几千里也。", passageId: "p-xiaoyao-1" }),
    item({ original: "吾生也有涯，而知也无涯。", passageId: "p-yangsheng-1" }),
    item({ original: "天地有大美而不言。", passageId: "p-zhibeiyou-1" }),
    item({ original: "泉涸，鱼相与处于陆。", passageId: "p-dazong-3", translation: "泉水干涸，鱼儿一起困在陆地上" }),
  ];

  it("单字查询：包含即命中", () => {
    const r = matchItems(items, "鱼");
    expect(r.map((x) => x.item.passageId)).toEqual(["p-xiaoyao-1", "p-dazong-3"]);
  });

  it("双字查询：直接包含", () => {
    const r = matchItems(items, "无涯");
    expect(r.map((x) => x.item.passageId)).toEqual(["p-yangsheng-1"]);
  });

  it("三字及以上：所有双字共现（AND）", () => {
    const r = matchItems(items, "其名为鲲");
    expect(r.map((x) => x.item.passageId)).toEqual(["p-xiaoyao-1"]);
  });

  it("AND 语义：缺任一 gram 不命中", () => {
    // 「名鲲」：gram=名鲲；「名为」「为鲲」在原文里是「名为鲲」——
    // 「名鲲」不连续，不命中
    const r = matchItems(items, "名鲲");
    expect(r).toEqual([]);
  });

  it("精确连续命中排最前", () => {
    const r = matchItems(items, "鱼相与");
    // 原文「泉涸，鱼相与处于陆」精确连续命中
    expect(r[0]!.item.passageId).toBe("p-dazong-3");
  });

  it("译文命中不召回（只搜原文）", () => {
    // 「泉水干涸」只出现在译文里，原文没有 → 不应命中
    const r = matchItems(items, "泉水干涸");
    expect(r).toEqual([]);
  });

  it("注疏命中不召回（只搜原文）", () => {
    // mock 注疏内容只存在于 commentary 字段
    const withCommentary = [
      ...items,
      item({
        original: "天地有大美而不言。",
        passageId: "p-zhibeiyou-2",
        commentary: "此句为庄子论自然之美的名句",
      }),
    ];
    const r = matchItems(withCommentary, "自然之美");
    expect(r).toEqual([]);
  });

  it("空查询返回空", () => {
    expect(matchItems(items, "  ")).toEqual([]);
    expect(matchItems(items, "")).toEqual([]);
  });
});
