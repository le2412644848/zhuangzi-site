/**
 * 批量生成每页独立的 OG 分享图（TODO 3.2）。
 *
 * 此前 33 篇 + 27 概念共用一张 og-image.png。本脚本在构建期用 SVG 模板
 * 为每篇/每概念生成 1200×630 的 PNG（篇名 + 题解 + 篇序 + 站点署名），
 * 社交分享时能直接看到是哪一篇，点击率收益明显。
 *
 * 产物（gitignore）：public/og/chapters/<id>.png、public/og/concepts/<id>.png
 *
 * 依赖：sharp（devDependency；CI 需安装中文字体：
 *   sudo apt-get install -y fonts-noto-cjk，见 .github/workflows/ci.yml）
 *
 * 运行：node scripts/gen-og-images.mjs（已接入 npm run build）
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src", "data");
const OUT = join(ROOT, "public", "og");

const W = 1200;
const H = 630;

/** XML 转义（标题/摘要会含引号、书名号等） */
function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 截断长文本（SVG 单行显示） */
function clamp(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function svgTemplate({ badge, title, summary, footer }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FBF9F5"/>
      <stop offset="1" stop-color="#F0E8DA"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8B5E3C"/>
      <stop offset="1" stop-color="#B8975A"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- 顶部装饰线 -->
  <rect x="0" y="0" width="${W}" height="10" fill="url(#accent)"/>
  <!-- 左下墨色印章 -->
  <rect x="64" y="470" width="96" height="96" rx="6" fill="none" stroke="#8B5E3C" stroke-width="3" opacity="0.85"/>
  <text x="112" y="518" font-family="'Noto Serif CJK SC','Source Han Serif SC','SimSun','Microsoft YaHei',serif" font-size="30" fill="#8B5E3C" text-anchor="middle" opacity="0.85">${esc(badge)}</text>
  <text x="112" y="546" font-family="'Noto Serif CJK SC','Source Han Serif SC','SimSun','Microsoft YaHei',serif" font-size="16" fill="#8B5E3C" text-anchor="middle" opacity="0.7">典藏</text>
  <!-- 站点名 -->
  <text x="64" y="86" font-family="'Noto Serif CJK SC','Source Han Serif SC','SimSun','Microsoft YaHei',serif" font-size="26" fill="#6B5D4E" letter-spacing="8">莊子數位典藏</text>
  <!-- 标题 -->
  <text x="64" y="300" font-family="'Noto Serif CJK SC','Source Han Serif SC','SimSun','Microsoft YaHei',serif" font-size="96" font-weight="700" fill="#2A2218">${esc(title)}</text>
  <rect x="66" y="330" width="140" height="6" rx="3" fill="url(#accent)"/>
  <!-- 摘要 -->
  <text x="64" y="400" font-family="'Noto Serif CJK SC','Source Han Serif SC','SimSun','Microsoft YaHei',serif" font-size="30" fill="#7A6B5D">${esc(clamp(summary, 40))}</text>
  <!-- 页脚 -->
  <text x="64" y="${H - 36}" font-family="'Noto Serif CJK SC','Source Han Serif SC','SimSun','Microsoft YaHei',serif" font-size="22" fill="#A89880" letter-spacing="4">${esc(footer)}</text>
</svg>`;
}

const chapters = JSON.parse(readFileSync(join(DATA, "chapters", "metadata.json"), "utf8"));
const concepts = JSON.parse(readFileSync(join(DATA, "concepts", "index.json"), "utf8")).concepts;

mkdirSync(join(OUT, "chapters"), { recursive: true });
mkdirSync(join(OUT, "concepts"), { recursive: true });

let count = 0;

for (const ch of chapters) {
  const svg = svgTemplate({
    badge: `${ch.order}`,
    title: ch.title,
    summary: ch.summary,
    footer: `${ch.category} · 第${ch.order}篇 · ${ch.passageCount}节`,
  });
  await sharp(Buffer.from(svg)).resize(W, H).png().toFile(join(OUT, "chapters", `${ch.id}.png`));
  count++;
}

for (const c of concepts) {
  const svg = svgTemplate({
    badge: "概",
    title: c.name,
    summary: c.summary,
    footer: "核心概念",
  });
  await sharp(Buffer.from(svg)).resize(W, H).png().toFile(join(OUT, "concepts", `${c.id}.png`));
  count++;
}

console.log(`[gen-og-images] 已生成 ${count} 张 OG 图 → public/og/`);
writeFileSync(join(ROOT, "public", "og", ".gitkeep"), "", "utf8");
