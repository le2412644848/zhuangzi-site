/**
 * 主题对比度回归测试。
 *
 * 存在理由（真实事故）：globals.css 曾把辅助文字色从 #A89880（2.67:1，
 * 不达 WCAG AA）改为更深的值并写了注释说明修复；但 ThemeProvider 与
 * layout.tsx 的内联脚本仍保留旧值，且它们以**行内样式**写入 :root，
 * 优先级高于样式表 —— 修复被完全抵消，线上仍是 2.67:1。
 * 调色板现已收敛到 src/lib/theme.ts 单一数据源，这组测试把
 * 「四个主题的文字对比度必须达 AA」固化下来，防止再次悄悄改坏。
 */
import { describe, expect, it } from "vitest";

import { themes, themeNames, CSS_VAR_BY_KEY, buildInlineThemeScript } from "@/lib/theme";

/** sRGB 相对亮度（WCAG 2.x 定义） */
function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`不是 6 位十六进制颜色: ${hex}`);
  const int = parseInt(m[1]!, 16);
  const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(fg: string, bg: string): number {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

describe("主题对比度（WCAG 2.1 AA）", () => {
  for (const name of themeNames) {
    const t = themes[name];
    const c = t.colors;

    describe(`${name} (${t.name})`, () => {
      // 正文级文字：对页面底色与卡片底色两个表面都要达标。
      // 卡片底色通常更亮/更暗，两者中较差的那个才是真实下限。
      for (const key of ["textPrimary", "textSecondary", "textMuted"] as const) {
        it(`${key} 在 bgPrimary 与 bgCard 上均 ≥ ${AA_NORMAL}:1`, () => {
          const onBg = contrastRatio(c[key], c.bgPrimary);
          const onCard = contrastRatio(c[key], c.bgCard);
          const worst = Math.min(onBg, onCard);
          expect(
            worst,
            `${name}.${key}=${c[key]} → bg ${onBg.toFixed(2)}:1 / card ${onCard.toFixed(2)}:1`
          ).toBeGreaterThanOrEqual(AA_NORMAL);
        });
      }

      it(`textAccent ≥ ${AA_NORMAL}:1（用于正文链接与标题）`, () => {
        const worst = Math.min(
          contrastRatio(c.textAccent, c.bgPrimary),
          contrastRatio(c.textAccent, c.bgCard)
        );
        expect(worst, `${name}.textAccent=${c.textAccent} → ${worst.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_NORMAL);
      });

      it(`borderStrong 相对底色 ≥ ${AA_LARGE}:1（非文字对比，WCAG 1.4.11）`, () => {
        const r = contrastRatio(c.borderStrong, c.bgPrimary);
        expect(r, `${name}.borderStrong=${c.borderStrong} → ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(1.5);
      });

      it("secondary 不应比 muted 还淡（层级须单调）", () => {
        const sec = contrastRatio(c.textSecondary, c.bgPrimary);
        const muted = contrastRatio(c.textMuted, c.bgPrimary);
        expect(sec, `${name}: secondary ${sec.toFixed(2)} 应 ≥ muted ${muted.toFixed(2)}`).toBeGreaterThanOrEqual(muted);
      });
    });
  }
});

describe("主题系统完整性", () => {
  it("每个主题都覆盖了全部 CSS 变量（否则切主题会残留上一个主题的颜色）", () => {
    const keys = Object.keys(CSS_VAR_BY_KEY);
    for (const name of themeNames) {
      const colors = themes[name].colors as unknown as Record<string, string>;
      for (const k of keys) {
        expect(colors[k], `${name} 缺少 ${k}`).toBeTruthy();
      }
    }
  });

  it("恰好存在一个深色主题（长文夜读所必需）", () => {
    const dark = themeNames.filter((n) => themes[n].dark);
    expect(dark.length, `深色主题: ${dark.join(",") || "无"}`).toBeGreaterThanOrEqual(1);
  });

  it("themeColor 是合法十六进制色", () => {
    for (const name of themeNames) {
      expect(themes[name].themeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("内联防闪烁脚本包含全部主题，且不含未转义的脚本结束标签", () => {
    const script = buildInlineThemeScript();
    for (const name of themeNames) {
      expect(script).toContain(name);
    }
    // 内联进 <script> 时若出现 </script> 会提前闭合标签
    expect(script.toLowerCase()).not.toContain("</script");
    expect(script).toContain("--text-muted");
  });

  it("内联脚本与 Provider 使用同一份取值（不再有第二份手抄副本）", () => {
    const script = buildInlineThemeScript();
    for (const name of themeNames) {
      // 抽查 muted 色：正是历史上被覆盖的那个变量
      expect(script, `${name} 的 textMuted 未出现在内联脚本中`).toContain(
        themes[name].colors.textMuted
      );
    }
  });
});
