/**
 * 主题系统 —— 单一数据源 (single source of truth)
 *
 * 背景：调色板此前存在三份手工同步的副本
 *   1. globals.css 的 :root / .dark
 *   2. components/ThemeProvider.tsx 的 themes 对象
 *   3. app/layout.tsx 内联防闪烁 <script> 里的字面量
 * 任何一处改动没同步到另两处，就会出现「样式闪烁」或「无障碍修复被静默覆盖」。
 * 实际事故：globals.css 把 --color-ink-muted 从 #A89880(2.67:1) 修正为
 * #7D6E57(4.71:1) 以满足 WCAG AA，但 ThemeProvider 与内联脚本仍写
 * #A89880，且它们以 **行内样式** 落到 documentElement 上，优先级高于
 * 样式表，于是修复被完全抵消。
 *
 * 现在：调色板只在本文件定义；CSS 变量名映射、内联脚本、React Provider
 * 全部由此派生。tests/unit/theme-contrast.test.ts 会对每个主题校验对比度，
 * 保证 AA 修复不会再被悄悄改坏。
 */

export type ThemeName = "xuanzhi" | "zhujian" | "moyun" | "qinghua" | "yedu";

/** 一个主题需要覆盖的全部可换肤颜色 */
export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgCardHover: string;
  textPrimary: string;
  textSecondary: string;
  /** 辅助文字。必须 ≥4.5:1（对 bgPrimary 与 bgCard 两个表面都要满足） */
  textMuted: string;
  textAccent: string;
  accentDeep: string;
  accentGold: string;
  /** 远山竹青（设计规范 v1.0 新增）——概念标签、探索性功能点睛 */
  accentBamboo: string;
  /** 危险/错误语义色（v1.0 补充）：错误提示、删除操作。必须对 bgPrimary 满足 AA ≥4.5:1 */
  danger: string;
  /** 朱砂色（用于印章、眉批、校勘朱记）。必须对 bgPrimary 与 bgCard 满足 AA ≥4.5:1 */
  accentVermilion: string;
  /** 主按钮文字色（用于 bg-[var(--text-accent)] 按钮）。必须对 textAccent 满足 AA ≥4.5:1 */
  btnAccentText: string;
  borderColor: string;
  borderLight: string;
  borderStrong: string;
  hoverBg: string;
  hoverBgStrong: string;
  selectionBg: string;
  /** 阴影基色（rgb 三元组字符串），深色主题用纯黑 */
  shadowRgb: string;
}

export interface ThemeDefinition {
  /** 中文显示名 */
  name: string;
  /** 切换器图标 */
  icon: string;
  /** 是否深色配色 —— 用于 color-scheme 与 <meta name="theme-color"> */
  dark: boolean;
  /** 浏览器 UI 主题色 */
  themeColor: string;
  colors: ThemeColors;
}

export const themes: Record<ThemeName, ThemeDefinition> = {
  xuanzhi: {
    name: "宣纸",
    icon: "宣",
    dark: false,
    themeColor: "#8E5431",
    colors: {
      bgPrimary: "#FAF8F4",
      bgSecondary: "#F3ECE1",
      bgCard: "#FFFFFF",
      bgCardHover: "#FDFBF7",
      textPrimary: "#231C14",
      textSecondary: "#665747",
      // 规范 #827463 → 4.28:1 不足 AA；加深为 #7E7062 → 4.52:1
      textMuted: "#7E7062",
      textAccent: "#8E5431",
      accentDeep: "#703D20",
      accentGold: "#BFA05E",
      accentBamboo: "#416353",
      danger: "#C24438",
      accentVermilion: "#B83B2E",
      btnAccentText: "#FFFFFF",
      borderColor: "#E8DFCF",
      borderLight: "#F2ECE1",
      borderStrong: "#D5C7B0",
      hoverBg: "rgba(142, 84, 49, 0.06)",
      hoverBgStrong: "rgba(142, 84, 49, 0.10)",
      selectionBg: "rgba(142, 84, 49, 0.15)",
      shadowRgb: "35, 28, 20",
    },
  },
  zhujian: {
    name: "竹简",
    icon: "竹",
    dark: false,
    themeColor: "#5A6B3A",
    colors: {
      bgPrimary: "#F3F0E4",
      bgSecondary: "#E8E3D2",
      bgCard: "#FAF7EC",
      bgCardHover: "#F2EEDD",
      textPrimary: "#3A3520",
      textSecondary: "#6B6340",
      // was #9B9060 → 2.81:1
      textMuted: "#766D49",
      textAccent: "#5A6B3A",
      accentDeep: "#3F4C26",
      accentGold: "#A08B4A",
      // 竹简主题：竹青偏正绿
      accentBamboo: "#47705A",
      danger: "#A4452E",
      accentVermilion: "#AD362B",
      btnAccentText: "#FFFFFF",
      borderColor: "#D8D0B0",
      borderLight: "#E8E2C8",
      borderStrong: "#C4B994",
      hoverBg: "rgba(90, 107, 58, 0.07)",
      hoverBgStrong: "rgba(90, 107, 58, 0.12)",
      selectionBg: "rgba(90, 107, 58, 0.16)",
      shadowRgb: "58, 53, 32",
    },
  },
  moyun: {
    name: "墨韵",
    icon: "墨",
    dark: false,
    themeColor: "#333333",
    colors: {
      bgPrimary: "#F5F5F5",
      bgSecondary: "#EEEEEE",
      bgCard: "#FFFFFF",
      bgCardHover: "#F7F7F7",
      textPrimary: "#1A1A1A",
      textSecondary: "#5C5C5C",
      // was #999999 → 2.61:1
      textMuted: "#707070",
      textAccent: "#333333",
      accentDeep: "#111111",
      accentGold: "#8A8A8A",
      // 墨韵主题：低饱和灰绿
      accentBamboo: "#55655C",
      danger: "#C0392B",
      accentVermilion: "#B0382C",
      btnAccentText: "#FFFFFF",
      borderColor: "#D5D5D5",
      borderLight: "#E5E5E5",
      borderStrong: "#BDBDBD",
      hoverBg: "rgba(0, 0, 0, 0.04)",
      hoverBgStrong: "rgba(0, 0, 0, 0.08)",
      selectionBg: "rgba(0, 0, 0, 0.12)",
      shadowRgb: "0, 0, 0",
    },
  },
  qinghua: {
    name: "青花",
    icon: "青",
    dark: false,
    themeColor: "#2B5F8A",
    colors: {
      bgPrimary: "#F7F9FB",
      bgSecondary: "#EDF2F7",
      bgCard: "#FFFFFF",
      bgCardHover: "#F4F8FC",
      textPrimary: "#1A2A3A",
      textSecondary: "#4A6278",
      // was #7A8EA0 → 3.21:1
      textMuted: "#647483",
      textAccent: "#2B5F8A",
      accentDeep: "#1B4263",
      accentGold: "#7A93A8",
      // 青花主题：竹青偏青绿
      accentBamboo: "#2F7A6D",
      danger: "#C24438",
      accentVermilion: "#B0382C",
      btnAccentText: "#FFFFFF",
      borderColor: "#D0DDE8",
      borderLight: "#E0EAF3",
      borderStrong: "#B4C7D8",
      hoverBg: "rgba(43, 95, 138, 0.06)",
      hoverBgStrong: "rgba(43, 95, 138, 0.11)",
      selectionBg: "rgba(43, 95, 138, 0.15)",
      shadowRgb: "26, 42, 58",
    },
  },
  /**
   * 夜读 —— 真正的深色主题。
   * 此前 globals.css 里存在 .dark 变量块，但没有任何代码添加 `dark` 类
   * （ThemeProvider 反而每次都 classList.remove("dark")），四个主题全是浅色，
   * 长文夜读没有可用方案。此主题把那份配色接回真实可切换的状态。
   */
  yedu: {
    name: "夜读",
    icon: "夜",
    dark: true,
    themeColor: "#14120F",
    colors: {
      bgPrimary: "#161412",
      bgSecondary: "#1F1B16",
      bgCard: "#24201A",
      bgCardHover: "#2A2620",
      textPrimary: "#EAE4D9",
      textSecondary: "#A69D8E",
      textMuted: "#9A9081",
      textAccent: "#D49B6A",
      accentDeep: "#EFC08A",
      accentGold: "#DEBE7C",
      // 夜读主题：暗夜竹青
      accentBamboo: "#689781",
      danger: "#E06050",
      accentVermilion: "#E56B5B",
      btnAccentText: "#161412",
      borderColor: "#38322A",
      borderLight: "#2C2822",
      borderStrong: "#443E36",
      hoverBg: "rgba(212, 155, 106, 0.08)",
      hoverBgStrong: "rgba(212, 155, 106, 0.14)",
      selectionBg: "rgba(212, 155, 106, 0.22)",
      shadowRgb: "0, 0, 0",
    },
  },
};

export const DEFAULT_THEME: ThemeName = "xuanzhi";
export const THEME_STORAGE_KEY = "siteTheme";

/** ThemeColors 字段 → CSS 自定义属性名。内联脚本与 Provider 共用。 */
export const CSS_VAR_BY_KEY: Record<keyof ThemeColors, string> = {
  bgPrimary: "--bg-primary",
  bgSecondary: "--bg-secondary",
  bgCard: "--bg-card",
  bgCardHover: "--bg-card-hover",
  textPrimary: "--text-primary",
  textSecondary: "--text-secondary",
  textMuted: "--text-muted",
  textAccent: "--text-accent",
  accentDeep: "--color-accent-deep",
  accentGold: "--color-accent-gold",
  accentBamboo: "--color-accent-bamboo",
  danger: "--color-danger",
  accentVermilion: "--color-accent-vermilion",
  btnAccentText: "--btn-accent-text",
  borderColor: "--border-color",
  borderLight: "--border-light",
  borderStrong: "--border-strong",
  hoverBg: "--hover-bg",
  hoverBgStrong: "--hover-bg-strong",
  selectionBg: "--selection-bg",
  shadowRgb: "--shadow-rgb",
};

export const themeNames = Object.keys(themes) as ThemeName[];

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(themes, value);
}

/** 把一个主题展开成 [cssVarName, value][]，供 Provider 与内联脚本使用 */
export function themeCssVarEntries(name: ThemeName): [string, string][] {
  const def = themes[name];
  return (Object.keys(CSS_VAR_BY_KEY) as (keyof ThemeColors)[]).map((key) => [
    CSS_VAR_BY_KEY[key],
    def.colors[key],
  ]);
}

/**
 * 生成防闪烁内联脚本。
 * 在 <head> 里同步执行：读 localStorage 主题 → 立刻写 CSS 变量，
 * 避免首帧用默认色渲染再跳变。脚本内容由上面的调色板派生，
 * 不再是手抄的字面量。
 *
 * 同时新增：没有存过主题时，跟随系统 prefers-color-scheme 选择夜读/宣纸。
 */
export function buildInlineThemeScript(): string {
  const palette: Record<string, Record<string, string>> = {};
  for (const name of themeNames) {
    palette[name] = Object.fromEntries(themeCssVarEntries(name));
  }
  const meta = Object.fromEntries(
    themeNames.map((n) => [n, { dark: themes[n].dark, tc: themes[n].themeColor }])
  );

  // 注意：这段字符串会进入 dangerouslySetInnerHTML，内容全部来自本模块的
  // 构建期常量（无用户输入），JSON.stringify 已转义引号。
  return `(function(){try{var P=${JSON.stringify(palette)},M=${JSON.stringify(
    meta
  )},D=${JSON.stringify(DEFAULT_THEME)};var t=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY
  )});if(!t||!P[t]){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'yedu':D;}var v=P[t],r=document.documentElement;for(var k in v){r.style.setProperty(k,v[k]);}r.classList.toggle('dark',!!M[t].dark);r.style.colorScheme=M[t].dark?'dark':'light';var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute('content',M[t].tc);}}catch(e){}})()`;
}
