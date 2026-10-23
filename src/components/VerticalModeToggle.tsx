"use client";

import { useEffect, useState } from "react";

export default function VerticalModeToggle() {
  const [vertical, setVertical] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("verticalMode");
    if (stored === "true") {
      // 挂载后读 localStorage（hydration-safe：SSR 无法访问 localStorage）
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVertical(true);
      document.documentElement.classList.add("vertical-mode");
    }
  }, []);

  const toggle = () => {
    const next = !vertical;
    setVertical(next);
    document.documentElement.classList.toggle("vertical-mode", next);
    localStorage.setItem("verticalMode", next ? "true" : "false");
  };

  const label = vertical
    ? "古籍竖排模式（已开启，点击切换横排）"
    : "古籍竖排模式（点击开启）";

  return (
    <button
      onClick={toggle}
      aria-pressed={vertical}
      aria-label={label}
      title={label}
      className={`text-xs min-w-[32px] min-h-[32px] px-2 py-1 rounded border transition-colors inline-flex items-center justify-center gap-1.5 ${
        vertical
          ? "border-[var(--text-accent)] text-[var(--text-accent)] bg-[var(--text-accent)]/10"
          : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {/* 极简古籍竖线/横线小图标：直观表达排版排布形态 */}
      {vertical ? (
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="2.5" y1="4.5" x2="13.5" y2="4.5" />
          <line x1="2.5" y1="8" x2="13.5" y2="8" />
          <line x1="2.5" y1="11.5" x2="13.5" y2="11.5" />
        </svg>
      ) : (
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="4.5" y1="2.5" x2="4.5" y2="13.5" />
          <line x1="8" y1="2.5" x2="8" y2="13.5" />
          <line x1="11.5" y1="2.5" x2="11.5" y2="13.5" />
        </svg>
      )}
      <span>{vertical ? "横排" : "竖排"}</span>
    </button>
  );
}
