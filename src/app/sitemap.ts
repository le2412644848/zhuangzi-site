import type { MetadataRoute } from "next";

import { chaptersMeta } from "@/data/chapters/metadata";
import { concepts } from "@/data/concepts";
import { canonicalUrl, CONTENT_LAST_MODIFIED } from "@/lib/site";

export const dynamic = "force-static";

/**
 * 稳定日期：内容为静态庄子文本，lastModified 不应在每次构建时都变成「今天」
 * （否则会误导搜索引擎认为全站每日更新，反而降低对真实更新的敏感度）。
 */
const LAST_MODIFIED = new Date(CONTENT_LAST_MODIFIED);

/**
 * ⚠️ URL 必须用 canonicalUrl() 生成。
 * next.config.ts 开了 trailingSlash: true，站点实际提供的是 `/chapters/`；
 * 此前 sitemap 写的是无尾斜杠的 `/chapters`，与 canonical 形式不一致 ——
 * 搜索引擎抓到的每条 sitemap URL 都会先吃一次 308 跳转，浪费抓取预算，
 * 且造成 sitemap 与 canonical 互相矛盾的信号。
 *
 * 另外：只收录**可索引**的页面。依赖 localStorage 的个人数据页
 * （/bookmarks /annotations /report /cards /reading-path）与站内搜索结果
 * （/search）已在各自 layout 里声明 noindex，若仍留在 sitemap 中属自相矛盾，
 * Search Console 会报「已提交但被 noindex 排除」。故此处移除。
 */
const INDEXABLE_PAGES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "monthly" },
  { path: "/chapters", priority: 0.9, changeFrequency: "monthly" },
  { path: "/concepts", priority: 0.8, changeFrequency: "monthly" },
  { path: "/zhuangzi", priority: 0.8, changeFrequency: "yearly" },
  { path: "/quotes", priority: 0.7, changeFrequency: "monthly" },
  { path: "/fables", priority: 0.7, changeFrequency: "monthly" },
  { path: "/reading-routes", priority: 0.6, changeFrequency: "monthly" },
  { path: "/timeline", priority: 0.6, changeFrequency: "yearly" },
  { path: "/map", priority: 0.6, changeFrequency: "yearly" },
  { path: "/concordance", priority: 0.6, changeFrequency: "monthly" },
  { path: "/ask-zhuangzi", priority: 0.6, changeFrequency: "monthly" },
  { path: "/compare", priority: 0.5, changeFrequency: "monthly" },
  { path: "/heatmap", priority: 0.5, changeFrequency: "yearly" },
  { path: "/translate-challenge", priority: 0.5, changeFrequency: "monthly" },
  { path: "/recite", priority: 0.5, changeFrequency: "monthly" },
  { path: "/dream", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/attributions", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = INDEXABLE_PAGES.map((p) => ({
    url: canonicalUrl(p.path),
    lastModified: LAST_MODIFIED,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // 内篇为庄子亲著、最具检索价值，给更高 priority
  const chapterPages: MetadataRoute.Sitemap = chaptersMeta.map((ch) => ({
    url: canonicalUrl(`/chapters/${ch.id}`),
    lastModified: LAST_MODIFIED,
    changeFrequency: "yearly" as const,
    priority: ch.category === "内篇" ? 0.9 : 0.7,
  }));

  const conceptPages: MetadataRoute.Sitemap = concepts.map((c) => ({
    url: canonicalUrl(`/concepts/${c.id}`),
    lastModified: LAST_MODIFIED,
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...chapterPages, ...conceptPages];
}
