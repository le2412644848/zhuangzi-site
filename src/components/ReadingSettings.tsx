"use client";

import { useState, useEffect } from "react";

const settings = [
  { key: "fontSize", label: "字号", values: ["sm", "base", "lg", "xl"], labels: ["小", "中", "大", "特大"] },
  { key: "lineHeight", label: "行距", values: ["1.6", "1.9", "2.2", "2.5"], labels: ["窄", "标准", "宽", "特宽"] },
  { key: "readingWidth", label: "版心", values: ["narrow", "normal", "wide"], labels: ["窄", "标准", "宽"] },
] as const;

export default function ReadingSettings() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("readingSettings");
    if (saved) {
      try {
        setValues(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const apply = (key: string, val: string) => {
    const next = { ...values, [key]: val };
    setValues(next);
    localStorage.setItem("readingSettings", JSON.stringify(next));
    document.documentElement.style.setProperty(`--reading-${key}`, val);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
        title="阅读设置"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
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
