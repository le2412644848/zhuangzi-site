"use client";

import { useCallback, useRef, useState } from "react";

import { SIMP_MAP, TRAD_MAP } from "@/data/trad-map";

type Script = "simp" | "trad";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "INPUT",
  "TEXTAREA",
  "SVG",
  "PATH",
  "CODE",
  "PRE",
  "KBD",
]);

function convertText(text: string, target: Script): string {
  const map = target === "trad" ? TRAD_MAP : SIMP_MAP;
  let result = "";
  for (const char of text) {
    result += map[char] ?? char;
  }
  return result;
}

function collectTextNodes(): Text[] {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      // 允许局部标记「不要转换」（如已是繁体的站点标识）
      if (parent.closest("[data-no-script-convert]")) return NodeFilter.FILTER_REJECT;
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

/**
 * 简/繁字形切换。
 *
 * 两点修正（原实现的问题）：
 *
 * 1. **文本讹误** —— 原表含「一简对多繁」的逐字映射，最典型的是
 *    千→韆（「韆」只用于「鞦韆」），会把《逍遥游》「不知其几千里也」
 *    转成「几韆里」；同类还有 面→麵、只→隻、发→發、历→曆、后→後、于→於。
 *    现映射表由 scripts/gen-trad-map.mjs 生成，仅保留无歧义的一对一字，
 *    歧义字保持原样（宁可少转，不可转错）。
 *
 * 2. **不可逆的 DOM 改写** —— 原实现直接覆写 textContent，来回切换靠反向表
 *    再转一次；映射非双射时无法还原，反复切换会累积讹字。
 *    现在首次转换前把原文存入 WeakMap，切回简体时优先按原文还原。
 *
 * 已知限制：本组件在客户端遍历 DOM 改写文本，React 重新渲染后新节点会恢复
 * 简体（不会产生错字，只是失效）。彻底方案是在数据层提供繁体字段或
 * 引入 opencc 级别的词组转换，见 docs/IMPROVEMENT-ROADMAP.md。
 */
export default function SimplifiedToggle() {
  const [script, setScript] = useState<Script>("simp");
  // 原文备份：保证「繁 → 简」无损还原，而不是再做一次有损反向映射
  const originals = useRef(new WeakMap<Text, string>());

  const applyScript = useCallback((target: Script) => {
    for (const node of collectTextNodes()) {
      const current = node.textContent ?? "";
      if (target === "trad") {
        if (!originals.current.has(node)) originals.current.set(node, current);
        const converted = convertText(originals.current.get(node) ?? current, "trad");
        if (converted !== current) node.textContent = converted;
      } else {
        const original = originals.current.get(node);
        const restored = original ?? convertText(current, "simp");
        if (restored !== current) node.textContent = restored;
      }
    }
    // 字形变了，语言标记也要跟着变，否则屏幕阅读器与搜索引擎拿到错误的脚本信号
    document.documentElement.lang = target === "trad" ? "zh-Hant" : "zh-Hans";
  }, []);

  const toggle = () => {
    const next: Script = script === "simp" ? "trad" : "simp";
    setScript(next);
    applyScript(next);
  };

  const label = script === "simp" ? "切换到繁体字形" : "切換到簡體字形";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={script === "trad"}
      aria-label={label}
      title={label}
      className="text-xs min-w-[32px] min-h-[32px] px-2.5 py-1 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-[var(--text-accent)] transition-colors"
    >
      <span aria-hidden="true" data-no-script-convert>
        {script === "simp" ? "繁" : "简"}
      </span>
    </button>
  );
}
