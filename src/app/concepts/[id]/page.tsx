import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ConceptTag from "@/components/ConceptTag";
import { chapters } from "@/data/chapters";
import { passageNumber } from "@/data/chapters/metadata";
import { concepts } from "@/data/concepts";
import { canonicalUrl, ogImageFor, SITE_NAME, SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return concepts.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const concept = concepts.find((c) => c.id === id);
  if (!concept) return { title: "未找到" };
  const url = canonicalUrl(`/concepts/${concept.id}`);
  // 每概念独立 OG 图（构建期生成，见 scripts/gen-og-images.mjs）
  const ogImage = ogImageFor(`/concepts/${concept.id}`);
  return {
    title: concept.name,
    description: concept.summary,
    alternates: { canonical: url },
    openGraph: {
      title: `${concept.name} — 庄子核心概念`,
      description: concept.summary,
      url,
      type: "article",
      locale: "zh_CN",
      siteName: SITE_NAME,
      images: [{ ...ogImage, alt: concept.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${concept.name} — 庄子核心概念`,
      description: concept.summary,
      images: [ogImage.url],
    },
  };
}

export default async function ConceptPage({ params }: Props) {
  const { id } = await params;
  const concept = concepts.find((c) => c.id === id);
  if (!concept) notFound();

  // Find all passages related to this concept
  const relatedPassages = chapters.flatMap((ch) =>
    ch.passages
      .filter((p) => p.concepts.includes(concept.id))
      .map((p) => ({ chapter: ch, passage: p }))
  );

  // Related concepts
  const relatedConcepts = concept.relatedConcepts
    .map((cid) => concepts.find((c) => c.id === cid))
    .filter(Boolean);

  const conceptUrl = canonicalUrl(`/concepts/${concept.id}`);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "DefinedTerm",
                "@id": `${conceptUrl}#term`,
                name: concept.name,
                description: concept.summary,
                inLanguage: "zh-Hans",
                inDefinedTermSet: {
                  "@type": "DefinedTermSet",
                  "@id": `${SITE_URL}/concepts/#termset`,
                  name: "庄子核心概念",
                  url: canonicalUrl("/concepts"),
                },
                url: conceptUrl,
                mainEntityOfPage: { "@type": "WebPage", "@id": conceptUrl },
                // 该概念在原文中出现的篇章，给搜索引擎一条实体→文本的关联
                subjectOf: relatedPassages.slice(0, 10).map((rp) => ({
                  "@type": "Chapter",
                  name: rp.chapter.title,
                  url: canonicalUrl(`/chapters/${rp.chapter.id}`),
                })),
              },
              {
                "@type": "BreadcrumbList",
                "@id": `${conceptUrl}#breadcrumb`,
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "首页", item: canonicalUrl("/") },
                  { "@type": "ListItem", position: 2, name: "核心概念", item: canonicalUrl("/concepts") },
                  { "@type": "ListItem", position: 3, name: concept.name, item: conceptUrl },
                ],
              },
            ],
          }),
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/concepts"
            prefetch={false}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
          >
            ← 全部概念
          </Link>

          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-wider text-[var(--text-accent)]">
            {concept.name}
          </h1>

          <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            {concept.summary}
          </p>

          {concept.description && (
            <div className="mt-6 text-sm text-[var(--text-primary)] leading-relaxed space-y-2 max-w-2xl">
              {concept.description.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {/* Related concepts */}
          {relatedConcepts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-[var(--text-secondary)] self-center">
                关联概念：
              </span>
              {relatedConcepts.map((rc) =>
                rc ? (
                  <ConceptTag
                    key={rc.id}
                    conceptId={rc.id}
                    name={rc.name}
                    size="sm"
                  />
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Related passages */}
        <section>
          <h2 className="text-lg font-medium mb-6 tracking-wide">
            相关段落
            <span className="text-sm text-[var(--text-secondary)] ml-2 font-normal">
              ({relatedPassages.length} 段)
            </span>
          </h2>

          {relatedPassages.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] italic">
              暂无相关段落。
            </p>
          ) : (
            <div className="space-y-6">
              {relatedPassages.map(({ chapter, passage }, idx) => (
                <div
                  key={`${chapter.id}-${passage.id}`}
                  className={`p-4 sm:p-5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] ${idx >= 2 ? "cv-auto" : ""}`}
                >
                  <Link
                    href={`/chapters/${chapter.id}#passage-${passage.id}`}
                    prefetch={false}
                    className="text-sm font-medium text-[var(--text-accent)] hover:underline"
                  >
                    {chapter.title} · 第 {passageNumber(chapter.id, passage.id) ?? "?"} 节
                  </Link>
                  <p className="mt-2 text-sm text-[var(--text-primary)] leading-relaxed original-text">
                    {passage.original.length > 200
                      ? passage.original.slice(0, 200) + "…"
                      : passage.original}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] italic">
                    {passage.translation.length > 150
                      ? passage.translation.slice(0, 150) + "…"
                      : passage.translation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* In which chapters */}
        <section className="mt-12 cv-auto">
          <h2 className="text-lg font-medium mb-4 tracking-wide">
            出现篇章
          </h2>
          <div className="flex flex-wrap gap-2">
            {concept.relatedChapters.map((chId) => {
              const ch = chapters.find((c) => c.id === chId);
              if (!ch) return null;
              return (
                <Link
                  key={chId}
                  href={`/chapters/${chId}`}
                  prefetch={false}
                  className="px-3 py-1.5 rounded border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-[var(--text-accent)] transition-colors"
                >
                  {ch.title}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
