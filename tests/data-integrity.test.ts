/**
 * 数据完整性测试 —— 本项目最高价值的一组测试。
 *
 * 理由：本站的「产品」就是那约 6MB 手工整理的 JSON（33 篇原文、白话、
 * 逐字注、考据训诂、概念图谱）。代码可以重装依赖恢复，数据不能。
 * 而全部 JSON 都是通过 `as Chapter` / `as KaojuMap` 这类**未经校验的类型断言**
 * 进入应用的：数据形状一旦变化，TypeScript 不会报错，页面只会静默少内容
 * （例如 kaoju 的键从 "01" 变了，getKaojuByChapter 的 `?? []` 会让全篇注释
 * 无声消失）。这些断言的安全性此前完全没有测试兜底。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DATA = join(process.cwd(), "src", "data");
const CHAPTERS_DIR = join(DATA, "chapters");

const readJson = (p: string): unknown => JSON.parse(readFileSync(p, "utf8"));

interface Passage {
  id: string;
  original: string;
  translation: string;
  commentary?: string;
  concepts?: string[];
  annotations?: { term: string; text: string }[];
  translations?: { translator: string; text: string }[];
}
interface Chapter {
  id: string;
  title: string;
  category: string;
  order: number;
  summary: string;
  conclusion?: string;
  intro?: string;
  passages: Passage[];
}
interface ChapterMeta {
  id: string;
  title: string;
  category: string;
  order: number;
  summary: string;
  passageCount: number;
  passageIds?: string[];
}
interface Concept {
  id: string;
  name: string;
  summary: string;
  relatedChapters: string[];
  relatedConcepts: string[];
}
interface KaojuEntry {
  seq: number;
  seg: number;
  term: string;
  explanation: string;
  citations: { author: string; quote: string; source?: string }[];
}

const chapterFiles = readdirSync(CHAPTERS_DIR)
  .filter((f) => /^\d{2}-[a-z-]+\.json$/.test(f))
  .sort();

const chapters = chapterFiles.map(
  (f) => readJson(join(CHAPTERS_DIR, f)) as Chapter
);
const meta = readJson(join(CHAPTERS_DIR, "metadata.json")) as ChapterMeta[];
const concepts = (readJson(join(DATA, "concepts", "index.json")) as {
  concepts: Concept[];
}).concepts;

const VALID_CATEGORIES = new Set(["内篇", "外篇", "杂篇"]);
const chapterIds = new Set(chapters.map((c) => c.id));
const conceptIds = new Set(concepts.map((c) => c.id));

describe("章节数据结构", () => {
  it("恰好 33 篇", () => {
    expect(chapterFiles).toHaveLength(33);
  });

  it("每篇必备字段齐全且类型正确", () => {
    for (const ch of chapters) {
      expect(ch.id, `${ch.id}: id 格式`).toMatch(/^\d{2}-[a-z-]+$/);
      expect(ch.title?.length, `${ch.id}: title`).toBeGreaterThan(0);
      expect(VALID_CATEGORIES.has(ch.category), `${ch.id}: category=${ch.category}`).toBe(true);
      expect(Number.isInteger(ch.order), `${ch.id}: order`).toBe(true);
      expect(ch.summary?.length, `${ch.id}: summary`).toBeGreaterThan(0);
      expect(Array.isArray(ch.passages), `${ch.id}: passages`).toBe(true);
      expect(ch.passages.length, `${ch.id}: passages 非空`).toBeGreaterThan(0);
    }
  });

  it("order 为 1..33 且无重复", () => {
    const orders = chapters.map((c) => c.order).sort((a, b) => a - b);
    expect(orders).toEqual(Array.from({ length: 33 }, (_, i) => i + 1));
  });

  it("篇 id 与文件名一致", () => {
    chapterFiles.forEach((f, i) => {
      expect(`${chapters[i]!.id}.json`).toBe(f);
    });
  });

  it("原文与译文均非空", () => {
    for (const ch of chapters) {
      for (const p of ch.passages) {
        expect(p.original?.trim().length, `${ch.id}/${p.id}: original 为空`).toBeGreaterThan(0);
        expect(p.translation?.trim().length, `${ch.id}/${p.id}: translation 为空`).toBeGreaterThan(0);
      }
    }
  });

  it("passage id 全局唯一", () => {
    const seen = new Map<string, string>();
    for (const ch of chapters) {
      for (const p of ch.passages) {
        expect(seen.has(p.id), `passage id 重复: ${p.id} (${seen.get(p.id)} / ${ch.id})`).toBe(false);
        seen.set(p.id, ch.id);
      }
    }
  });

  it("passage id 以所属篇 id 为前缀（chapters.ts 与 kaoju 查找依赖此约定）", () => {
    for (const ch of chapters) {
      for (const p of ch.passages) {
        expect(p.id.startsWith(ch.id), `${p.id} 不以 ${ch.id} 开头`).toBe(true);
      }
    }
  });
});

describe("文本卫生", () => {
  // U+FFFD 是编码损坏的痕迹；本项目历史上有过 PowerShell 写坏中文的先例
  it("不含 U+FFFD 替换字符（编码损坏）", () => {
    for (const ch of chapters) {
      const blob = JSON.stringify(ch);
      const idx = blob.indexOf("\uFFFD");
      expect(idx, `${ch.id} 含替换字符，附近: ${blob.slice(Math.max(0, idx - 40), idx + 40)}`).toBe(-1);
    }
  });

  it("不含开发期占位文本", () => {
    for (const ch of chapters) {
      const blob = JSON.stringify(ch);
      for (const marker of ["TEST_COMMENTARY", "TODO", "FIXME", "lorem ipsum", "PLACEHOLDER"]) {
        expect(blob.includes(marker), `${ch.id} 含占位标记 ${marker}`).toBe(false);
      }
    }
  });

  it("annotations 的 term/text 均非空", () => {
    for (const ch of chapters) {
      for (const p of ch.passages) {
        for (const a of p.annotations ?? []) {
          expect(a.term?.length, `${p.id}: 空 term`).toBeGreaterThan(0);
          expect(a.text?.length, `${p.id}/${a.term}: 空注释`).toBeGreaterThan(0);
        }
      }
    }
  });

  /**
   * 注释分两类：
   *  - 内联型：term 出现在原文中 → 渲染为原文里的虚下划线 + 浮层
   *  - 主题型：term 是「庖丁解牛」「朝三暮四」这类概括性词条，原文并无该字串
   * 原实现只处理内联型，主题型被 indexOf 判否后**静默丢弃**（实测 29 条）。
   * 现由 PassageView 的「要义」区回收展示，故此处不再要求全部可内联，
   * 只把「主题型注释的数量」钉住 —— 一旦显著增长，说明可能混入了
   * 本应内联却因标点/异体字对不上的数据，需要人工复核。
   */
  it("主题型注释（无法内联）数量在已知范围内，且已被「要义」区回收", () => {
    const thematic: string[] = [];
    for (const ch of chapters) {
      for (const p of ch.passages) {
        for (const a of p.annotations ?? []) {
          if (!p.original.includes(a.term)) thematic.push(`${p.id}: 「${a.term}」`);
        }
      }
    }
    const totalAnnotations = chapters.reduce(
      (n, ch) => n + ch.passages.reduce((m, p) => m + (p.annotations?.length ?? 0), 0),
      0
    );
    // 基线 29/1049 ≈ 2.8%；留出余量但不允许比例失控
    expect(
      thematic.length / totalAnnotations,
      `主题型注释占比过高（${thematic.length}/${totalAnnotations}），请核查是否有本应内联的注释因标点不一致而落到此类:\n${thematic.slice(0, 30).join("\n")}`
    ).toBeLessThan(0.06);
  });
});

describe("引用完整性", () => {
  it("passage 引用的 concept id 都存在", () => {
    const bad: string[] = [];
    for (const ch of chapters) {
      for (const p of ch.passages) {
        for (const cid of p.concepts ?? []) {
          if (!conceptIds.has(cid)) bad.push(`${p.id} → ${cid}`);
        }
      }
    }
    expect(bad, `未知 concept 引用:\n${bad.join("\n")}`).toEqual([]);
  });

  it("concept 的 relatedConcepts / relatedChapters 都指向真实实体", () => {
    const bad: string[] = [];
    for (const c of concepts) {
      for (const rc of c.relatedConcepts ?? []) {
        if (!conceptIds.has(rc)) bad.push(`concept ${c.id}.relatedConcepts → ${rc}`);
      }
      for (const rch of c.relatedChapters ?? []) {
        // relatedChapters 可能写篇 id 或篇名，两者都接受
        const ok = chapterIds.has(rch) || chapters.some((ch) => ch.title === rch);
        if (!ok) bad.push(`concept ${c.id}.relatedChapters → ${rch}`);
      }
    }
    expect(bad, bad.join("\n")).toEqual([]);
  });
});

describe("metadata.json 与章节正文保持同步", () => {
  // generate_metadata.py 曾漏输出 passageIds，而 passageNumber() 依赖它
  // 来渲染「第 N 节」——这里把不一致固化为测试失败。
  it("每篇都在 metadata 中且 passageCount 正确", () => {
    for (const ch of chapters) {
      const m = meta.find((x) => x.id === ch.id);
      expect(m, `${ch.id} 不在 metadata.json 中`).toBeTruthy();
      expect(m!.passageCount, `${ch.id}: passageCount`).toBe(ch.passages.length);
      expect(m!.title).toBe(ch.title);
      expect(m!.category).toBe(ch.category);
      expect(m!.order).toBe(ch.order);
    }
  });

  it("passageIds 存在且与正文顺序完全一致", () => {
    for (const ch of chapters) {
      const m = meta.find((x) => x.id === ch.id)!;
      expect(m.passageIds, `${ch.id}: 缺 passageIds（会导致「第 N 节」失效）`).toBeDefined();
      expect(m.passageIds).toEqual(ch.passages.map((p) => p.id));
    }
  });

  it("metadata 没有多余条目", () => {
    for (const m of meta) {
      expect(chapterIds.has(m.id), `metadata 中的 ${m.id} 没有对应章节文件`).toBe(true);
    }
  });
});

describe("考据 / 训诂数据键位可用", () => {
  // lib/kaoju.ts 用 chapterId.split("-")[0] 取 "01" 这样的两位键。
  // 若键位约定变化，查找会静默返回 [] —— 全篇注释消失且无任何报错。
  const files = ["kaoju.json", "kaoju_fang.json"] as const;

  for (const file of files) {
    it(`${file} 的键都是可映射到真实篇目的两位序号`, () => {
      const map = readJson(join(DATA, file)) as Record<string, KaojuEntry[]>;
      const keys = Object.keys(map);
      expect(keys.length).toBeGreaterThan(0);
      for (const k of keys) {
        expect(k, `${file}: 键 ${k} 不是两位数字`).toMatch(/^\d{2}$/);
        const owner = chapters.find((c) => c.id.split("-")[0] === k);
        expect(owner, `${file}: 键 ${k} 没有对应篇目`).toBeTruthy();
      }
    });
  }

  const passageFiles = ["passage_kaoju.json", "passage_kaoju_fang.json"] as const;

  for (const file of passageFiles) {
    it(`${file} 的 passage 键都指向真实段落`, () => {
      const map = readJson(join(DATA, file)) as Record<string, Record<string, KaojuEntry[]>>;
      const allPassageIds = new Set(chapters.flatMap((c) => c.passages.map((p) => p.id)));
      const bad: string[] = [];
      for (const [chKey, byPassage] of Object.entries(map)) {
        expect(chKey, `${file}: 键 ${chKey}`).toMatch(/^\d{2}$/);
        for (const pid of Object.keys(byPassage)) {
          if (!allPassageIds.has(pid)) bad.push(`${file}: ${chKey}/${pid}`);
        }
      }
      expect(bad, `未知 passage 键:\n${bad.slice(0, 20).join("\n")}`).toEqual([]);
    });
  }

  it("至少覆盖内篇七篇，且条目结构完整", () => {
    const map = readJson(join(DATA, "kaoju.json")) as Record<string, KaojuEntry[]>;
    for (const n of ["01", "02", "03", "04", "05", "06", "07"]) {
      expect(map[n]?.length, `内篇 ${n} 无考据数据`).toBeGreaterThan(0);
    }
    for (const [k, entries] of Object.entries(map)) {
      for (const e of entries.slice(0, 5)) {
        expect(e.term?.length, `${k}: 空 term`).toBeGreaterThan(0);
        expect(Array.isArray(e.citations), `${k}/${e.term}: citations 非数组`).toBe(true);
      }
    }
  });
});
