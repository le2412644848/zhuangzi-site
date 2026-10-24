"use client";

import { useCallback, useRef, useState } from "react";

type Script = "simp" | "trad";
type TradMapModule = typeof import("@/data/trad-map");

let cachedTradMapPromise: Promise<TradMapModule> | null = null;
function loadTradMap(): Promise<TradMapModule> {
  if (!cachedTradMapPromise) {
    cachedTradMapPromise = import("@/data/trad-map");
  }
  return cachedTradMapPromise;
}

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

function convertText(text: string, map: Readonly<Record<string, string>>): string {
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
 * 简/繁字形切换（映射表按需异步加载，不在首屏预绑）。
 */
export default function SimplifiedToggle() {
  const [script, setScript] = useState<Script>("simp");
  const originals = useRef(new WeakMap<Text, string>());

  const applyScript = useCallback(async (target: Script) => {
    const { TRAD_MAP, SIMP_MAP } = await loadTradMap();
    for (const node of collectTextNodes()) {
      const current = node.textContent ?? "";
      if (target === "trad") {
        if (!originals.current.has(node)) originals.current.set(node, current);
        const converted = convertText(originals.current.get(node) ?? current, TRAD_MAP);
        if (converted !== current) node.textContent = converted;
      } else {
        const original = originals.current.get(node);
        const restored = original ?? convertText(current, SIMP_MAP);
        if (restored !== current) node.textContent = restored;
      }
    }
    document.documentElement.lang = target === "trad" ? "zh-Hant" : "zh-Hans";
  }, []);

  const toggle = () => {
    const next: Script = script === "simp" ? "trad" : "simp";
    setScript(next);
    void applyScript(next);
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
