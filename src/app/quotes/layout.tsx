// 由 scripts/gen-route-metadata.mjs 生成后可自由手改。
// 作用：本路由的 page.tsx 是 "use client"，无法 export metadata；
// 该 layout 作为 server component 提供本页专属 title / description / canonical，
// 避免继承根布局的首页 canonical 而被判重去索引。
import type { Metadata } from "next";

import quotesData from "@/data/quotes.json";
import { canonicalUrl, OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "名句精选";
const DESCRIPTION =
  "《庄子》名句精选，按逍遥、齐物、养生、处世、生死、真知等十类主题编排，每句附出处篇章与白话释义。";
const URL_PATH = "/quotes";

interface QuoteRecord {
  id: string;
  text: string;
  chapter: string;
  chapterId: string;
  theme: string;
  explanation?: string;
}

const quotes = (quotesData as { quotes: QuoteRecord[] }).quotes;

const quotesJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${canonicalUrl(URL_PATH)}#collection`,
      name: `${TITLE} — ${SITE_NAME}`,
      description: DESCRIPTION,
      inLanguage: "zh-Hans",
      url: canonicalUrl(URL_PATH),
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: quotes.length,
        itemListElement: quotes.map((q, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Quotation",
            "@id": `${canonicalUrl(URL_PATH)}#${q.id}`,
            text: q.text,
            inLanguage: "zh-Hant",
            about: q.theme,
            description: q.explanation,
            spokenByCharacter: { "@type": "Person", name: "庄子" },
            isBasedOn: {
              "@type": "Chapter",
              "@id": `${canonicalUrl(`/chapters/${q.chapterId}`)}#chapter`,
              name: q.chapter,
              url: canonicalUrl(`/chapters/${q.chapterId}`),
            },
          },
        })),
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "首页", item: canonicalUrl("/") },
        { "@type": "ListItem", position: 2, name: TITLE, item: canonicalUrl(URL_PATH) },
      ],
    },
  ],
};

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

export default function QuotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
        名句用 Quotation 类型标注，并通过 isBasedOn 指回所属篇章。
        page.tsx 是客户端组件，结构化数据放在 layout（server component）里
        才能进入静态 HTML 被爬虫读到。
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(quotesJsonLd) }}
      />
      {children}
    </>
  );
}
