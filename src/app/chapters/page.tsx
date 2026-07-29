import Link from "next/link";
import { chapters } from "@/data/chapters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "篇章",
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
    accent: "from-stone-600/10 to-stone-500/5",
  },
  杂篇: {
    description: "杂纂汇编，十一篇博采",
    accent: "from-teal-700/10 to-teal-600/5",
  },
};

export default function ChaptersPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
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
          const catChapters = chapters.filter((c) => c.category === cat);
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
                    {info.description}
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
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {ch.summary}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span>{ch.passages.length} 段落</span>
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
