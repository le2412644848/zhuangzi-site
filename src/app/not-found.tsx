import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "未找到",
};

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 sm:py-36 text-center">
      {/* 404 in calligraphic style */}
      <div className="text-8xl sm:text-9xl font-bold text-[var(--text-accent)]/8 font-serif leading-none mb-8 select-none">
        404
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-[0.04em] text-[var(--text-primary)] mb-5">
        此页无何有
      </h1>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto mb-4">
        吾生也有涯，而知也无涯。
      </p>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto mb-10">
        以有涯随无涯，殆已。你所寻之物，或在知识之海的另一端。
      </p>

      <div className="flex items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--text-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-deep)] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          回到首页
        </Link>
        <Link
          href="/chapters"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-[var(--text-accent)]/40 transition-all"
        >
          浏览篇章
        </Link>
      </div>

      <div className="ink-divider" />

      <p className="text-xs text-[var(--text-muted)]">
        方生方死，方死方生。此页不在，他处犹存。
      </p>
    </div>
  );
}
