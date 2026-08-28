"use client";

import { useEffect, useRef, useState } from "react";

import { themeNames, themes } from "@/lib/theme";

import { useTheme } from "./ThemeProvider";

/**
 * 主题切换器（视觉复审 V3：由「5 个色板一字排开」收进单个弹层）。
 *
 * 触发按钮显示当前主题的印章字 + 一个主题色小圆点；点击展开弹层，
 * 弹层内保留 radiogroup 语义（role=radiogroup + aria-checked），
 * 读屏仍能感知「当前选中哪个」。右翼控件数由 9 收敛到 4。
 */
export default function ThemeSwitcher() {
  const { theme, setTheme, mounted } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部 / Escape 关闭弹层
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = themes[theme] ?? themes.xuanzhi;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="配色主题"
        aria-haspopup="true"
        aria-expanded={open}
        title="主题"
        className={`min-w-[32px] min-h-[32px] px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
          open
            ? "bg-[var(--text-accent)]/12 text-[var(--text-accent)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:bg-[var(--hover-bg)]"
        }`}
      >
        <span className="seal-char" style={{ marginRight: 0 }} aria-hidden="true">
          {current.icon}
        </span>
        {/* 当前主题小圆点：不认识印章字也能看出这是「颜色」入口 */}
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: current.colors.textAccent }}
        />
      </button>

      {open && (
        <>
          {/* 点击遮罩关闭：装饰性背景，对读屏隐藏（键盘用 Escape） */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="radiogroup"
            aria-label="配色主题"
            className="absolute right-0 top-full mt-2 z-50 min-w-[9rem] p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg"
          >
            {themeNames.map((key) => {
              const def = themes[key];
              const selected = mounted && theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setTheme(key);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    selected
                      ? "bg-[var(--text-accent)]/12 text-[var(--text-accent)] font-medium"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  <span className="seal-char" style={{ marginRight: 0 }} aria-hidden="true">
                    {def.icon}
                  </span>
                  <span className="flex-1 text-left">{def.name}</span>
                  {selected && (
                    <svg
                      aria-hidden="true"
                      className="w-3.5 h-3.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
