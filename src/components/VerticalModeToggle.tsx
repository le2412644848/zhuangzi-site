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

  return (
    <button
      onClick={toggle}
      aria-pressed={vertical}
      className={`text-xs min-w-[32px] min-h-[32px] px-2 py-1 rounded border transition-colors ${
        vertical
          ? "border-[var(--text-accent)] text-[var(--text-accent)] bg-[var(--text-accent)]/10"
          : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
      title={vertical ? "切换到横排排版" : "切换到古籍竖排排版"}
    >
      {/* 文案指代「目标态」（与 SimplifiedToggle 的「繁/简」一致），
          aria-pressed 表达「当前态」（视觉复审 V7-5） */}
      {vertical ? "横排" : "竖排"}
    </button>
  );
}
