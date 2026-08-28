// 由 scripts/gen-route-metadata.mjs 生成后可自由手改。
// 作用：本路由的 page.tsx 是 "use client"，无法 export metadata；
// 该 layout 作为 server component 提供本页专属 title / description / canonical，
// 避免继承根布局的首页 canonical 而被判重去索引。
import type { Metadata } from "next";

import { canonicalUrl, OG_IMAGE, SITE_NAME } from "@/lib/site";

const TITLE = "我的收藏";
const DESCRIPTION =
  "你收藏的《庄子》段落，按篇章归类，可回跳原文定位。数据仅保存在本地浏览器。";
const URL_PATH = "/bookmarks";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl(URL_PATH) },
  // 内容来自 localStorage（爬虫看到的是空页）/ 属站内搜索结果 → 不进索引，但保留链接权重
  robots: { index: false, follow: true },
  openGraph: {
    title: `${TITLE} — ${SITE_NAME}`,
    description: DESCRIPTION,
    url: canonicalUrl(URL_PATH),
    type: "website",
    locale: "zh_CN",
    siteName: SITE_NAME,
    images: [{ ...OG_IMAGE, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} — ${SITE_NAME}`,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function BookmarksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
