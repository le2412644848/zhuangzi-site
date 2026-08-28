/**
 * 简繁转换安全性测试。
 *
 * 存在理由（真实事故）：原映射表把「千」映射为「韆」。「韆」只用于
 * 「鞦韆」，于是《逍遥游》名句「鹏之背，不知其几千里也」在繁体模式下
 * 会显示成「几韆里」。语料中「千」出现 176 次、「面」500 次、
 * 「于」2076 次，逐字 1:1 替换会在古籍正文里制造大量讹字 —— 对一个
 * 以文本准确性为立身之本的典藏站，这是内容错误而非样式瑕疵。
 *
 * 规则：只允许「一简对一繁」的无歧义映射；一简对多繁的字一律不转换。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TRAD_MAP, SIMP_MAP, AMBIGUOUS_EXCLUDED } from "@/data/trad-map";

describe("简繁映射表", () => {
  it("非空且规模合理", () => {
    const n = Object.keys(TRAD_MAP).length;
    expect(n).toBeGreaterThan(200);
  });

  it("不含任何一简对多繁的歧义字", () => {
    const leaked = AMBIGUOUS_EXCLUDED.filter((c) => c in TRAD_MAP);
    expect(
      leaked,
      `以下歧义字不应出现在映射表中（会在部分语境下转出讹字）: ${leaked.join(" ")}`
    ).toEqual([]);
  });

  it("明确回归：千不得转为韆，面不得转为麵", () => {
    // 这两条是最初被发现的具体讹误，单独钉住
    expect(TRAD_MAP["千"]).toBeUndefined();
    expect(TRAD_MAP["面"]).toBeUndefined();
    expect(TRAD_MAP["只"]).toBeUndefined();
    expect(TRAD_MAP["后"]).toBeUndefined();
    expect(TRAD_MAP["于"]).toBeUndefined();
    expect(Object.values(TRAD_MAP)).not.toContain("韆");
    expect(Object.values(TRAD_MAP)).not.toContain("麵");
  });

  it("没有恒等映射（简繁同形的字无需入表）", () => {
    const identity = Object.entries(TRAD_MAP).filter(([s, t]) => s === t);
    expect(identity.map(([s]) => s)).toEqual([]);
  });

  it("反向映射唯一 —— 保证繁→简可无损还原", () => {
    const byTrad = new Map<string, string[]>();
    for (const [s, t] of Object.entries(TRAD_MAP)) {
      byTrad.set(t, [...(byTrad.get(t) ?? []), s]);
    }
    const collisions = [...byTrad.entries()].filter(([, v]) => v.length > 1);
    expect(
      collisions.map(([t, v]) => `${v.join("/")} → ${t}`),
      "多个简体字映射到同一繁体字，反向转换会产生歧义"
    ).toEqual([]);
  });

  it("SIMP_MAP 与 TRAD_MAP 严格互逆", () => {
    for (const [s, t] of Object.entries(TRAD_MAP)) {
      expect(SIMP_MAP[t], `${t} 的反向映射`).toBe(s);
    }
  });

  it("键值均为单个字符", () => {
    for (const [s, t] of Object.entries(TRAD_MAP)) {
      expect([...s]).toHaveLength(1);
      expect([...t]).toHaveLength(1);
    }
  });
});

describe("在真实语料上往返转换不产生讹字", () => {
  const CHAPTERS_DIR = join(process.cwd(), "src", "data", "chapters");
  const files = readdirSync(CHAPTERS_DIR).filter((f) => /^\d{2}-[a-z-]+\.json$/.test(f));

  const convert = (text: string, map: Readonly<Record<string, string>>) =>
    [...text].map((ch) => map[ch] ?? ch).join("");

  it("对全部 33 篇原文做 简→繁→简 往返后与原文完全一致", () => {
    const broken: string[] = [];
    for (const f of files) {
      const ch = JSON.parse(readFileSync(join(CHAPTERS_DIR, f), "utf8")) as {
        id: string;
        passages: { id: string; original: string }[];
      };
      for (const p of ch.passages) {
        const roundTrip = convert(convert(p.original, TRAD_MAP), SIMP_MAP);
        if (roundTrip !== p.original) {
          const i = [...p.original].findIndex((c, idx) => c !== [...roundTrip][idx]);
          broken.push(`${p.id} 位置 ${i}: 「${p.original[i]}」→「${roundTrip[i]}」`);
        }
      }
    }
    expect(broken, `往返转换不一致:\n${broken.slice(0, 20).join("\n")}`).toEqual([]);
  });

  it("繁体输出中不出现已知讹字", () => {
    // 韆(鞦韆) 麵(麵食) 隻(量词) 曆(曆法) —— 均只在特定词义下正确
    const FORBIDDEN = ["韆", "麵"];
    const hits: string[] = [];
    for (const f of files) {
      const ch = JSON.parse(readFileSync(join(CHAPTERS_DIR, f), "utf8")) as {
        passages: { id: string; original: string }[];
      };
      for (const p of ch.passages) {
        const trad = convert(p.original, TRAD_MAP);
        for (const bad of FORBIDDEN) {
          if (trad.includes(bad)) hits.push(`${p.id}: 出现「${bad}」`);
        }
      }
    }
    expect(hits, hits.slice(0, 20).join("\n")).toEqual([]);
  });
});
