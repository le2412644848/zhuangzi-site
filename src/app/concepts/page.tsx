import Link from "next/link";
import { concepts } from "@/data/concepts";
import type { Metadata } from "next";
import ThoughtMapWrapper from "@/components/ThoughtMapWrapper";
import KnowledgeGraphWrapper from "@/components/KnowledgeGraphWrapper";

export const metadata: Metadata = {
  title: "核心概念",
};

export default function ConceptsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          核心概念
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          庄子哲学的关键词，贯穿三十三篇的思想脉络
        </p>
        <div className="ink-divider" />
      </div>

      {/* Thought Map */}
      <section className="mb-16">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold tracking-[0.04em] mb-2 text-[var(--text-primary)]">
            思想脉络
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            核心概念在内篇七章中的分布与关联
          </p>
        </div>
        <ThoughtMapWrapper />
      </section>

      {/* Knowledge Graph */}
      <section className="mb-16">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold tracking-[0.04em] mb-2 text-[var(--text-primary)]">
            概念图谱
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            交互式概念关系可视化
          </p>
        </div>
        <KnowledgeGraphWrapper />
      </section>

      {/* Concept Cards Grid */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold tracking-[0.04em] mb-1 text-[var(--text-primary)]">
            全部概念
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {concepts.length} 个核心哲学概念
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
          {concepts.map((concept) => (
            <Link
              key={concept.id}
              href={`/concepts/${concept.id}`}
              className="card-interactive group p-5 flex flex-col gap-3"
            >
              <h3 className="text-lg font-semibold text-[var(--text-accent)] tracking-wide group-hover:text-[var(--color-accent-deep)] transition-colors">
                {concept.name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
                {concept.summary}
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] pt-1">
                <span>{concept.relatedChapters.length} 篇相关</span>
                {concept.relatedConcepts.length > 0 && (
                  <>
                    <span className="opacity-30">·</span>
                    <span>{concept.relatedConcepts.length} 个关联</span>
                  </>
                )}
                <span className="ml-auto group-hover:text-[var(--text-accent)] transition-colors">
                  查看 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
