import { notFound } from "next/navigation";
import Link from "next/link";
import { chapters } from "@/data/chapters";
import { concepts as conceptsData } from "@/data/concepts";
import { getAdjacentChapters } from "@/lib/chapters";
import PassageView from "@/components/PassageView";
import ChapterTOC from "@/components/ChapterTOC";
import KeyboardNav from "@/components/KeyboardNav";
import RelatedReadings from "@/components/RelatedReadings";
import RecordReading from "@/components/RecordReading";
import ConceptTag from "@/components/ConceptTag";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return chapters.map((ch) => ({ id: ch.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const chapter = chapters.find((c) => c.id === id);
  if (!chapter) return { title: "未找到" };
  return {
    title: `${chapter.title} — ${chapter.category}`,
    description: chapter.summary,
  };
}

export default async function ChapterPage({ params }: Props) {
  const { id } = await params;
  const chapter = chapters.find((c) => c.id === id);
  if (!chapter) { notFound(); return null; }

  const { prev, next } = getAdjacentChapters(id);
  const prevUrl = prev ? `/chapters/${prev.id}` : null;
  const nextUrl = next ? `/chapters/${next.id}` : null;

  const knownConceptIds = new Set(conceptsData.map((c) => c.id));
  const allConcepts = [...new Set(chapter.passages.flatMap((p) => p.concepts))]
    .filter((cid) => knownConceptIds.has(cid));
  const passageCount = chapter.passages.length;

  return (
    <>
      <ChapterTOC chapter={chapter} />
      <RecordReading chapterId={chapter.id} chapterTitle={chapter.title} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/chapters" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-accent)] transition-colors">
              ← 篇章
            </Link>
            <span className="text-[10px] text-[var(--text-muted)]">/</span>
            <span className="tag text-[10px]">{chapter.category}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[0.04em] text-[var(--text-accent)] mb-3">
            {chapter.title}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
            {chapter.summary}
          </p>

          <div className="flex items-center gap-3 mt-4 text-xs text-[var(--text-muted)]">
            <span>{chapter.category} · 第{chapter.order}篇</span>
            <span className="opacity-30">|</span>
            <span>{passageCount} 节</span>
            {allConcepts.length > 0 && (
              <>
                <span className="opacity-30">|</span>
                <span>{allConcepts.length} 个核心概念</span>
              </>
            )}
          </div>
        </div>

        {/* 题解 */}
        <div className="card p-6 sm:p-8 mb-14">
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-4">
            题解
          </h2>
          <div className="text-sm text-[var(--text-primary)] leading-[1.85] space-y-3 reading-prose">
            <p>
              {chapter.category === "内篇"
                ? `《${chapter.title}》为庄子内篇第${chapter.order}篇，庄子亲著。${chapter.summary}`
                : chapter.category === "外篇"
                  ? `《${chapter.title}》为庄子外篇之一，一般认为是庄子后学所作。${chapter.summary}`
                  : `《${chapter.title}》为庄子杂篇之一，收录于《南华真经》。${chapter.summary}`}
            </p>
            {chapter.conclusion && (
              <div className="pt-2 mt-2 border-t border-[var(--border-light)]">
                <p>{chapter.conclusion.slice(0, 200)}{chapter.conclusion.length > 200 ? "…" : ""}</p>
              </div>
            )}
          </div>

          {allConcepts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[var(--border-light)]">
              <span className="text-[11px] text-[var(--text-muted)] mr-1 self-center">关联概念：</span>
              {allConcepts.slice(0, 8).map((cid) => (
                <ConceptTag key={cid} conceptId={cid} size="sm" />
              ))}
              {allConcepts.length > 8 && (
                <Link href="/concepts" className="text-[11px] text-[var(--text-accent)] hover:underline self-center ml-1">
                  +{allConcepts.length - 8} 个
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Passages */}
        <div className="vertical-content">
          {chapter.passages.map((passage, idx) => (
            <div key={passage.id} id={`passage-${passage.id}`}>
              <div className="flex items-center gap-3 mb-8 mt-12 first:mt-0">
                <span className="text-xs font-medium text-[var(--text-muted)] tracking-[0.08em]">
                  第{idx + 1}节
                </span>
                <div className="flex-1 h-px bg-[var(--border-light)]" />
              </div>

              <PassageView
                passage={passage}
                chapterId={chapter.id}
                chapterTitle={chapter.title}
                defaultExpanded={true}
              />
            </div>
          ))}
        </div>

        {/* 本篇总结 */}
        {chapter.conclusion && (
          <section className="mt-16 pt-8 border-t border-[var(--border-light)]">
            <h2 className="text-lg font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-5">
              本篇总结
            </h2>
            <div className="text-sm text-[var(--text-primary)] leading-[1.85] space-y-3 reading-prose">
              {chapter.conclusion.split("\n").filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        )}

        <RelatedReadings chapterId={chapter.id} concepts={allConcepts} />

        <nav className="mt-14 pt-6 border-t border-[var(--border-light)] flex items-center justify-between">
          {prev ? (
            <Link href={`/chapters/${prev.id}`} className="group flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="hidden sm:inline">上一篇：</span>
              <span className="font-medium">{prev.title}</span>
            </Link>
          ) : <div />}

          {next ? (
            <Link href={`/chapters/${next.id}`} className="group flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
              <span className="font-medium">{next.title}</span>
              <span className="hidden sm:inline">：下一篇</span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ) : <div />}
        </nav>

        <KeyboardNav prevUrl={prevUrl} nextUrl={nextUrl} />
      </div>
    </>
  );
}
