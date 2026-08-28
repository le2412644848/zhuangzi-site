// 由 scripts/gen-route-metadata.mjs 生成后可自由手改。
// 作用：本路由的 page.tsx 是 "use client"，无法 export metadata；
// 该 layout 作为 server component 提供本页专属 title / description / canonical，
// 避免继承根布局的首页 canonical 而被判重去索引。
import type { Metadata } from "next";

import { canonicalUrl, OG_IMAGE, SITE_NAME } from "@/lib/site";

const TITLE = "阅读报告";
const DESCRIPTION =
  "根据本地阅读记录生成的《庄子》阅读统计报告 — 已读篇章、覆盖率、阅读时段与偏好主题。";
const URL_PATH = "/report";

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

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
