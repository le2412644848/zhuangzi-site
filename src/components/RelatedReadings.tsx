"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface RelatedPassage {
  chapterId: string;
  chapterTitle: string;
  passageId: string;
  original: string;
}

export default function RelatedReadings({
  chapterId,
  concepts,
}: {
  chapterId: string;
  concepts: string[];
}) {
  const [related, setRelated] = useState<RelatedPassage[]>([]);

  useEffect(() => {
    if (!concepts || concepts.length === 0) return;
    let cancelled = false;

    import("@/data/related.json").then((m) => {
      if (cancelled) return;
      const conceptMap = (m.default as { conceptMap: Record<string, RelatedPassage[]> }).conceptMap;
      const found: RelatedPassage[] = [];
      const seen = new Set<string>();

      for (const c of concepts) {
        const passages = conceptMap[c] || [];
        for (const p of passages) {
          // 修复存量 Bug：必须严格排除本篇自身，避免在本篇末尾推荐本篇已有段落
          if (p.chapterId === chapterId) continue;

          const key = `${p.chapterId}-${p.passageId}`;
          if (!seen.has(key)) {
            seen.add(key);
            found.push(p);
          }
        }
      }

      setRelated(found.slice(0, 8));
    });

    return () => {
      cancelled = true;
    };
  }, [chapterId, concepts]);

  if (related.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-[var(--border-light)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[var(--text-accent)] tracking-wide font-serif">
          跨篇互证 · 关联阅读
        </h3>
        <span className="text-xs text-[var(--text-muted)]">以庄解庄 · 义理相发</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {related.map((p) => (
          <Link
            key={`${p.chapterId}-${p.passageId}`}
            href={`/chapters/${p.chapterId}#passage-${p.passageId}`}
            className="p-3 rounded-lg border border-[var(--border-light)] hover:border-[var(--text-accent)]/40 hover:bg-[var(--hover-bg)] transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-accent)] transition-colors">
                《{p.chapterTitle}》
              </span>
              <span className="text-[10px] text-[var(--color-accent-vermilion)] tracking-wider">
                跨篇互证 ↗
              </span>
            </div>
            <p className="text-xs text-[var(--text-primary)] mt-1.5 leading-relaxed line-clamp-2">
              {p.original}…
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
