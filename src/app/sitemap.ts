import { chaptersMeta } from "@/data/chapters/metadata";
import { concepts } from "@/data/concepts";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = "https://zhuangzi-site.pages.dev";

// 稳定日期：内容为静态庄子文本，lastModified 不应在每次构建时都变成"今天"
// （否则会误导搜索引擎认为全站每日更新）。
const LAST_MODIFIED = new Date("2026-08-18");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/chapters`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/concepts`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/quotes`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/fables`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/timeline`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/map`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/concordance`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/heatmap`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/reading-routes`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/cards`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/search`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/bookmarks`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/annotations`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/report`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/ask-zhuangzi`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/translate-challenge`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/reading-path`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/compare`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/dream`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/zhuangzi`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
  ];

  const chapterPages: MetadataRoute.Sitemap = chaptersMeta.map((ch) => ({
    url: `${BASE_URL}/chapters/${ch.id}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const conceptPages: MetadataRoute.Sitemap = concepts.map((c) => ({
    url: `${BASE_URL}/concepts/${c.id}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...chapterPages, ...conceptPages];
}
