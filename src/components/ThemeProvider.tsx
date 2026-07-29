"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeName = "xuanzhi" | "zhujian" | "moyun" | "qinghua";

interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  borderColor: string;
  borderLight: string;
}

export const themes: Record<ThemeName, { name: string; icon: string; colors: ThemeColors }> = {
  xuanzhi: {
    name: "宣纸",
    icon: "📜",
    colors: {
      bgPrimary: "#FBF9F5",
      bgSecondary: "#F5EFE5",
      bgCard: "#FFFFFF",
      textPrimary: "#2A2218",
      textSecondary: "#7A6B5D",
      textMuted: "#A89880",
      textAccent: "#8B5E3C",
      borderColor: "#E8E0D5",
      borderLight: "#F0EBE2",
    },
  },
  zhujian: {
    name: "竹简",
    icon: "🎋",
    colors: {
      bgPrimary: "#F3F0E4",
      bgSecondary: "#E8E3D2",
      bgCard: "#FAF7EC",
      textPrimary: "#3A3520",
      textSecondary: "#6B6340",
      textMuted: "#9B9060",
      textAccent: "#5A6B3A",
      borderColor: "#D8D0B0",
      borderLight: "#E8E2C8",
    },
  },
  moyun: {
    name: "墨韵",
    icon: "🖌️",
    colors: {
      bgPrimary: "#F5F5F5",
      bgSecondary: "#EEEEEE",
      bgCard: "#FFFFFF",
      textPrimary: "#1A1A1A",
      textSecondary: "#5C5C5C",
      textMuted: "#999999",
      textAccent: "#333333",
      borderColor: "#D5D5D5",
      borderLight: "#E5E5E5",
    },
  },
  qinghua: {
    name: "青花",
    icon: "🏺",
    colors: {
      bgPrimary: "#F7F9FB",
      bgSecondary: "#EDF2F7",
      bgCard: "#FFFFFF",
      textPrimary: "#1A2A3A",
      textSecondary: "#4A6278",
      textMuted: "#7A8EA0",
      textAccent: "#2B5F8A",
      borderColor: "#D0DDE8",
      borderLight: "#E0EAF3",
    },
  },
};

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "xuanzhi",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("xuanzhi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("siteTheme");
    if (saved && Object.keys(themes).includes(saved)) {
      setTheme(saved as ThemeName);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("siteTheme", theme);
    const c = themes[theme].colors;
    const root = document.documentElement;
    root.style.setProperty("--bg-primary", c.bgPrimary);
    root.style.setProperty("--bg-secondary", c.bgSecondary);
    root.style.setProperty("--bg-card", c.bgCard);
    root.style.setProperty("--text-primary", c.textPrimary);
    root.style.setProperty("--text-secondary", c.textSecondary);
    root.style.setProperty("--text-muted", c.textMuted);
    root.style.setProperty("--text-accent", c.textAccent);
    root.style.setProperty("--border-color", c.borderColor);
    root.style.setProperty("--border-light", c.borderLight);
    // Ensure dark mode doesn't override theme
    root.classList.remove("dark");
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
