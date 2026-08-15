import { notFound } from "next/navigation";
import Link from "next/link";
import { concepts } from "@/data/concepts";
import { chapters } from "@/data/chapters";
import ConceptTag from "@/components/ConceptTag";
import type { Metadata } from "next";

const BASE_URL = "https://zhuangzi-site.pages.dev";

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
  const url = `${BASE_URL}/concepts/${concept.id}`;
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
      siteName: "莊子數位典藏",
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: concept.name,
        },
      ],
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: concept.name,
            description: concept.summary,
            inLanguage: "zh-CN",
            inDefinedTermSet: {
              "@type": "DefinedTermSet",
              name: "庄子核心概念",
            },
            mainEntityOfPage: `${BASE_URL}/concepts/${concept.id}`,
          }),
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/concepts"
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
              {relatedPassages.map(({ chapter, passage }) => (
                <div
                  key={`${chapter.id}-${passage.id}`}
                  className="p-4 sm:p-5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]"
                >
                  <Link
                    href={`/chapters/${chapter.id}#passage-${passage.id}`}
                    className="text-sm font-medium text-[var(--text-accent)] hover:underline"
                  >
                    {chapter.title} · {passage.id}
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
        <section className="mt-12">
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
