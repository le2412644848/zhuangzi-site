"use client";

import { useEffect, useState } from "react";

const settings = [
  { key: "fontSize", label: "字号", values: ["sm", "base", "lg", "xl"], labels: ["小", "中", "大", "特大"] },
  { key: "lineHeight", label: "行距", values: ["1.6", "1.9", "2.2", "2.5"], labels: ["窄", "标准", "宽", "特宽"] },
  { key: "readingWidth", label: "版心", values: ["narrow", "normal", "wide"], labels: ["窄", "标准", "宽"] },
] as const;

/** 设置值 → CSS 长度（localStorage 存符号值，:root 变量存可用的 CSS 值） */
const CSS_VALUE_MAP: Record<string, Record<string, string>> = {
  fontSize: { sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem" },
  lineHeight: { "1.6": "1.6", "1.9": "1.9", "2.2": "2.2", "2.5": "2.5" },
  readingWidth: { narrow: "36rem", normal: "48rem", wide: "56rem" },
};

function cssValue(key: string, val: string): string {
  return CSS_VALUE_MAP[key]?.[val] ?? val;
}

export default function ReadingSettings() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  // Escape 关闭（下拉面板的标准键盘行为）
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const saved = localStorage.getItem("readingSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, string>;
        // 挂载后读 localStorage 初始化（hydration-safe）
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValues(parsed);
        for (const [k, v] of Object.entries(parsed)) {
          document.documentElement.style.setProperty(`--reading-${k}`, cssValue(k, v));
        }
      } catch {}
    }
  }, []);

  const apply = (key: string, val: string) => {
    const next = { ...values, [key]: val };
    setValues(next);
    localStorage.setItem("readingSettings", JSON.stringify(next));
    document.documentElement.style.setProperty(`--reading-${key}`, cssValue(key, val));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
        title="阅读设置"
        aria-label="阅读设置"
        aria-expanded={open}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      </button>

      {open && (
        <>
          {/* 点击遮罩关闭：装饰性背景，对读屏隐藏（键盘用 Escape） */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg">
            <div className="text-xs font-medium text-[var(--text-secondary)] mb-3">阅读设置</div>
            {settings.map((s) => (
              <div key={s.key} className="mb-3 last:mb-0">
                <div className="text-xs text-[var(--text-secondary)] mb-1">{s.label}</div>
                <div className="flex gap-1">
                  {s.values.map((v, i) => (
                    <button
                      key={v}
                      onClick={() => apply(s.key, v)}
                      className={`flex-1 text-xs py-1 rounded transition-colors ${
                        values[s.key] === v || (!values[s.key] && i === 1)
                          ? "bg-[var(--text-accent)]/10 text-[var(--text-accent)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {s.labels[i]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
