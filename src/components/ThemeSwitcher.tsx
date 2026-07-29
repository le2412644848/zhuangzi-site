"use client";

import { useTheme, themes, ThemeName } from "./ThemeProvider";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const themeKeys = Object.keys(themes) as ThemeName[];

  return (
    <div className="flex items-center gap-0.5">
      {themeKeys.map((key) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={`px-2 py-1 text-[10px] rounded transition-all ${
            theme === key
              ? "bg-[var(--text-accent)]/10 text-[var(--text-accent)] font-medium"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
          title={themes[key].name}
        >
          {themes[key].icon}
        </button>
      ))}
    </div>
  );
}
