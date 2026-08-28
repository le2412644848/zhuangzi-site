"use client";

import { createContext, ReactNode,useCallback, useContext, useEffect, useState } from "react";

import {
  DEFAULT_THEME,
  isThemeName,
  THEME_STORAGE_KEY,
  themeCssVarEntries,
  type ThemeName,
  themes,
} from "@/lib/theme";

// 调色板已迁移至 @/lib/theme（单一数据源）。此处只负责状态与副作用。
// 重新导出以兼容既有 import 点（ThemeSwitcher 等）。
export { themes };
export type { ThemeName };

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  /** 已挂载（读过 localStorage）。未挂载前不要依赖 theme 做视觉判断。 */
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  mounted: false,
});

/** 把主题写入 document —— 与 head 内联脚本使用完全相同的映射表 */
function applyTheme(name: ThemeName) {
  const root = document.documentElement;
  for (const [cssVar, value] of themeCssVarEntries(name)) {
    root.style.setProperty(cssVar, value);
  }
  const def = themes[name];
  // 深色主题挂上 .dark：globals.css 的 .dark 规则（含 hero-gradient）由此生效。
  root.classList.toggle("dark", def.dark);
  // 让原生控件（滚动条、表单、日期选择器）跟随主题明暗
  root.style.colorScheme = def.dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", def.themeColor);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // 首次挂载：与内联脚本保持一致地解析初始主题
  // （已存主题 → 用它；否则跟随系统深色偏好）
  useEffect(() => {
    let initial: ThemeName = DEFAULT_THEME;
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeName(saved)) {
        initial = saved;
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        initial = "yedu";
      }
    } catch {
      // localStorage 不可用（隐私模式 / 已禁用）→ 用默认主题
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  // 用户没手动选过主题时，跟随系统明暗切换
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY)) return; // 用户已显式选择，尊重之
      } catch {
        return;
      }
      const next: ThemeName = e.matches ? "yedu" : DEFAULT_THEME;
      setThemeState(next);
      applyTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mounted]);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // 存储不可用时仍然应用主题，只是不持久化
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
