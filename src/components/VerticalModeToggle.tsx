"use client";

import { useEffect, useState } from "react";

export default function VerticalModeToggle() {
  const [vertical, setVertical] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("verticalMode");
    if (stored === "true") {
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
      className={`text-xs px-2 py-1 rounded border transition-colors ${
        vertical
          ? "border-[var(--text-accent)] text-[var(--text-accent)] bg-[var(--text-accent)]/10"
          : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
      title={vertical ? "切换到横排" : "切换到古籍竖排"}
    >
      {vertical ? "竖排" : "横排"}
    </button>
  );
}
