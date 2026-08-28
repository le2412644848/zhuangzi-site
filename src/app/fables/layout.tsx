// 由 scripts/gen-route-metadata.mjs 生成后可自由手改。
// 作用：本路由的 page.tsx 是 "use client"，无法 export metadata；
// 该 layout 作为 server component 提供本页专属 title / description / canonical，
// 避免继承根布局的首页 canonical 而被判重去索引。
import type { Metadata } from "next";

import { canonicalUrl, OG_IMAGE, SITE_NAME } from "@/lib/site";

const TITLE = "寓言故事";
const DESCRIPTION =
  "庄子寓言故事集 — 鲲鹏、庖丁解牛、庄周梦蝶、井底之蛙、濠梁之辩、鼓盆而歌等经典寓言的原文、译文与寓意解读。";
const URL_PATH = "/fables";

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

export default function FablesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
