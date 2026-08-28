import type { Metadata } from "next";
import Link from "next/link";

import ChapterProgressBadge from "@/components/ChapterProgressBadge";
import { chaptersMeta } from "@/data/chapters/metadata";
import { STARTER_CHAPTER_IDS } from "@/lib/chapters";
import { buildPageMetadata, canonicalUrl, SITE_URL } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "篇章",
  description:
    "《庄子》三十三篇总览 — 内篇七篇、外篇十五篇、杂篇十一篇，逐篇附题解、段落数与核心概念，可直接进入全文与注疏。",
  path: "/chapters",
});

/**
 * 整书结构化数据。
 *
 * 根布局只声明了 Book 实体本身（@id = #book），没有列出组成部分；
 * 搜索引擎因此无法把 33 个章节页理解为同一部书的篇目。
 * hasPart 放在本页（书的自然主页）而不是根布局 —— 否则 33 条 Chapter
 * 会被塞进全部 83 个页面的 JSON-LD，白白增加每页体积。
 */
const bookJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Book",
      "@id": `${SITE_URL}/#book`,
      name: "庄子",
      alternateName: ["南华真经", "莊子"],
      inLanguage: "zh-Hant",
      numberOfPages: chaptersMeta.length,
      url: canonicalUrl("/chapters"),
      author: {
        "@type": "Person",
        name: "庄周",
        alternateName: "庄子",
        sameAs: "https://www.wikidata.org/wiki/Q4700",
      },
      hasPart: chaptersMeta.map((ch) => ({
        "@type": "Chapter",
        "@id": `${canonicalUrl(`/chapters/${ch.id}`)}#chapter`,
        name: ch.title,
        position: ch.order,
        description: ch.summary,
        isPartOf: { "@id": `${SITE_URL}/#book` },
        url: canonicalUrl(`/chapters/${ch.id}`),
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "首页", item: canonicalUrl("/") },
        { "@type": "ListItem", position: 2, name: "篇章", item: canonicalUrl("/chapters") },
      ],
    },
  ],
};

const categories = ["内篇", "外篇", "杂篇"] as const;
const categoryInfo: Record<
  string,
  { description: string; accent: string }
> = {
  内篇: {
    description: "庄子亲著，七篇精粹",
    accent: "from-amber-700/10 to-amber-600/5",
  },
  外篇: {
    description: "后学演绎，十五篇广博",
    accent: "from-[var(--color-accent-bamboo)]/10 to-[var(--color-accent-bamboo)]/5",
  },
  杂篇: {
    description: "杂纂汇编，十一篇博采",
    accent: "from-stone-600/10 to-stone-500/5",
  },
};

export default function ChaptersPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          篇章
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          内篇精粹 · 外篇广博 · 杂篇绚丽
        </p>
        <div className="ink-divider" />
      </div>

      <div className="max-w-4xl mx-auto space-y-16">
        {categories.map((cat) => {
          const catChapters = chaptersMeta.filter((c) => c.category === cat);
          const info = categoryInfo[cat];
          return (
            <section key={cat}>
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-[var(--text-accent)] tracking-[0.06em]">
                    {cat}
                  </h2>
                  <span className="h-px flex-1 bg-[var(--border-light)]" />
                  <span className="text-xs text-[var(--text-muted)]">
                    {info?.description ?? ""}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {catChapters.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/chapters/${ch.id}`}
                    className="card-interactive group flex items-start gap-4 sm:gap-6 p-4 sm:p-5"
                  >
                    {/* Order number */}
                    <div className="chapter-badge flex-shrink-0">
                      {ch.order.toString().padStart(2, "0")}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-accent)] group-hover:text-[var(--color-accent-deep)] transition-colors tracking-wide">
                          {ch.title}
                        </h3>
                        <span className="tag flex-shrink-0">{cat}</span>
                        {STARTER_CHAPTER_IDS.has(ch.id) && (
                          <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-accent-gold)]/12 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/25">
                            ★ 入门首选
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {ch.summary}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span>{ch.passageCount} 段落</span>
                        <ChapterProgressBadge chapterId={ch.id} />
                        <span className="opacity-30">·</span>
                        <span className="group-hover:text-[var(--text-accent)] transition-colors">
                          阅读 →
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 self-center text-[var(--text-muted)] group-hover:text-[var(--text-accent)] group-hover:translate-x-0.5 transition-all">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
