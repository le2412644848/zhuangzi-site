// 由 scripts/gen-route-metadata.mjs 生成后可自由手改。
// 作用：本路由的 page.tsx 是 "use client"，无法 export metadata；
// 该 layout 作为 server component 提供本页专属 title / description / canonical，
// 避免继承根布局的首页 canonical 而被判重去索引。
import type { Metadata } from "next";

import { canonicalUrl, OG_IMAGE, SITE_NAME } from "@/lib/site";

const TITLE = "译文挑战";
const DESCRIPTION =
  "《庄子》文言翻译练习 — 给出原文段落，自行翻译后与参考译文逐句对照，检验对虚词、句式与文意的把握。";
const URL_PATH = "/translate-challenge";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl(URL_PATH) },
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

export default function TranslateChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
