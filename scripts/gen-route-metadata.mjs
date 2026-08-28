/**
 * 一次性生成器：为 `"use client"` 路由补 layout.tsx 元数据。
 *
 * 背景：`"use client"` 的 page.tsx 无法 export metadata，于是这 15 个路由
 * 全部继承了根布局的 title 与 canonical。根布局的 canonical 指向首页，
 * 等于让这些页面自称「首页副本」，会被搜索引擎判重去索引。
 * 惯用解法：在同目录放一个 server component layout.tsx 只导出 metadata。
 *
 * 运行：node scripts/gen-route-metadata.mjs
 * 生成后本脚本即可删除（产物是可读、可手改的源码）。
 */
import { existsSync,mkdirSync, writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "src", "app");

/**
 * index=false 的页面：内容依赖 localStorage（对爬虫是空页）或属站内搜索结果，
 * 主流做法是 noindex,follow —— 不进索引但仍传递链接权重。
 */
const routes = [
  {
    seg: "quotes",
    title: "名句精选",
    desc: "《庄子》名句精选，按逍遥、齐物、养生、处世、生死、真知等十类主题编排，每句附出处篇章与白话释义。",
  },
  {
    seg: "fables",
    title: "寓言故事",
    desc: "庄子寓言故事集 — 鲲鹏、庖丁解牛、庄周梦蝶、井底之蛙、濠梁之辩、鼓盆而歌等经典寓言的原文、译文与寓意解读。",
  },
  {
    seg: "concordance",
    title: "词语索引",
    desc: "《庄子》全文词语索引（concordance），按字词检索其在三十三篇中的全部用例与上下文，供文本细读与训诂考证使用。",
  },
  {
    seg: "heatmap",
    title: "词频热图",
    desc: "《庄子》全书词频数据可视化 — 以热力图呈现核心语汇在内篇、外篇、杂篇各章的分布密度与用词偏好差异。",
  },
  {
    seg: "reading-routes",
    title: "主题阅读路线",
    desc: "按主题串联的《庄子》引导式阅读路线 — 从逍遥自由、齐物相对、养生处世到生死超越，为不同关切提供成体系的篇章次第。",
  },
  {
    seg: "search",
    title: "全文搜索",
    desc: "检索《庄子》三十三篇的原文、白话翻译与历代注疏，支持模糊匹配与按内篇/外篇/杂篇、核心概念筛选。",
    index: false,
  },
  {
    seg: "ask-zhuangzi",
    title: "问庄子",
    desc: "以《庄子》原文为依据的问答式阅读辅助 — 提出人生与哲学困惑，检索相关段落并结合庄子思想作出回应。",
  },
  {
    seg: "compare",
    title: "诸子对谈",
    desc: "庄子与老子、孔子、孟子、荀子、韩非等先秦诸子的思想对照 — 同一命题下不同学派的立场差异与互相呼应。",
  },
  {
    seg: "dream",
    title: "庄周梦蝶",
    desc: "围绕「庄周梦蝶」展开的物化与真幻之思 — 齐物论名段的原文、译解，以及关于自我同一性的哲学延展。",
  },
  {
    seg: "translate-challenge",
    title: "译文挑战",
    desc: "《庄子》文言翻译练习 — 给出原文段落，自行翻译后与参考译文逐句对照，检验对虚词、句式与文意的把握。",
  },
  {
    seg: "cards",
    title: "名言卡片",
    desc: "把《庄子》名句生成可保存分享的图文卡片，支持多种配色与版式。",
    index: false,
  },
  {
    seg: "reading-path",
    title: "阅读进度",
    desc: "记录并规划你的《庄子》通读进度，按内篇、外篇、杂篇查看已读篇章与剩余篇目。",
    index: false,
  },
  {
    seg: "bookmarks",
    title: "我的收藏",
    desc: "你收藏的《庄子》段落，按篇章归类，可回跳原文定位。数据仅保存在本地浏览器。",
    index: false,
  },
  {
    seg: "annotations",
    title: "我的批注",
    desc: "你为《庄子》段落所作的个人批注，按篇章与节次归类，支持导出备份。数据仅保存在本地浏览器。",
    index: false,
  },
  {
    seg: "report",
    title: "阅读报告",
    desc: "根据本地阅读记录生成的《庄子》阅读统计报告 — 已读篇章、覆盖率、阅读时段与偏好主题。",
    index: false,
  },
];

const header = `// 由 scripts/gen-route-metadata.mjs 生成后可自由手改。
// 作用：本路由的 page.tsx 是 "use client"，无法 export metadata；
// 该 layout 作为 server component 提供本页专属 title / description / canonical，
// 避免继承根布局的首页 canonical 而被判重去索引。
`;

let created = 0;
let skipped = 0;

for (const r of routes) {
  const dir = join(APP, r.seg);
  if (!existsSync(dir)) {
    console.warn(`  ! 跳过（目录不存在）: ${r.seg}`);
    continue;
  }
  const file = join(dir, "layout.tsx");
  if (existsSync(file)) {
    console.log(`  = 已存在，跳过: ${r.seg}/layout.tsx`);
    skipped++;
    continue;
  }

  const robotsBlock = r.index === false
    ? `
  // 内容来自 localStorage（爬虫看到的是空页）/ 属站内搜索结果 → 不进索引，但保留链接权重
  robots: { index: false, follow: true },`
    : "";

  const body = `${header}import type { Metadata } from "next";

import { canonicalUrl, OG_IMAGE, SITE_NAME } from "@/lib/site";

const TITLE = ${JSON.stringify(r.title)};
const DESCRIPTION =
  ${JSON.stringify(r.desc)};
const URL_PATH = ${JSON.stringify("/" + r.seg)};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl(URL_PATH) },${robotsBlock}
  openGraph: {
    title: \`\${TITLE} — \${SITE_NAME}\`,
    description: DESCRIPTION,
    url: canonicalUrl(URL_PATH),
    type: "website",
    locale: "zh_CN",
    siteName: SITE_NAME,
    images: [{ ...OG_IMAGE, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: \`\${TITLE} — \${SITE_NAME}\`,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function ${r.seg.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
`;

  mkdirSync(dir, { recursive: true });
  writeFileSync(file, body, "utf8");
  console.log(`  + ${r.seg}/layout.tsx`);
  created++;
}

console.log(`\n完成：新建 ${created} 个，跳过 ${skipped} 个。`);
