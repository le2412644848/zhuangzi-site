import type { Metadata } from "next";
import Link from "next/link";

import SearchBar from "@/components/SearchBar";
import { chaptersMeta } from "@/data/chapters/metadata";

export const metadata: Metadata = {
  title: "未找到",
  // 错误页不应进索引，也不需要 canonical
  robots: { index: false, follow: false },
};

// 404 快捷出口：名篇 + 枢纽页（主流站 404 标配：搜索 + 热门入口，
// 让断链访客一步回到内容，而不是只剩「回首页」）
const featured = ["01-xiaoyao-you", "02-qiwu-lun", "03-yangsheng-zhu", "17-qiushui"];

export default function NotFound() {
  const chapters = chaptersMeta.filter((c) => featured.includes(c.id));

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

      {/* 搜索 —— 断链访客最可能的意图是找特定内容 */}
      <div className="flex justify-center mb-6">
        <SearchBar compact />
      </div>

      <div className="flex items-center justify-center gap-3 mb-10">
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

      {/* 名篇快捷入口 */}
      <p className="text-xs font-medium text-[var(--text-muted)] tracking-[0.1em] uppercase mb-4">
        或从此处入
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {chapters.map((ch) => (
          <Link
            key={ch.id}
            href={`/chapters/${ch.id}`}
            className="card-interactive group p-3 flex flex-col items-center gap-1"
          >
            <span className="chapter-badge">{ch.order.toString().padStart(2, "0")}</span>
            <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors tracking-wide">
              {ch.title}
            </span>
          </Link>
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        方生方死，方死方生。此页不在，他处犹存。
      </p>
    </div>
  );
}
