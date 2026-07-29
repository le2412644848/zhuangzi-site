"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RelatedPassage {
  chapterId: string; chapterTitle: string; passageId: string; original: string;
}

export default function RelatedReadings({ chapterId, concepts }: { chapterId: string; concepts: string[] }) {
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
          const key = `${p.chapterId}-${p.passageId}`;
          if (!seen.has(key)) {
            seen.add(key);
            found.push(p);
          }
        }
      }

      setRelated(found.slice(0, 8));
    });

    return () => { cancelled = true; };
  }, [chapterId, concepts]);

  if (related.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-[var(--border-light)]">
      <h3 className="text-sm font-medium text-[var(--text-accent)] mb-3 tracking-wide">关联阅读</h3>
      <div className="grid sm:grid-cols-2 gap-2">
        {related.map((p) => (
          <Link key={`${p.chapterId}-${p.passageId}`} href={`/chapters/${p.chapterId}`}
            className="p-3 rounded border border-[var(--border-light)] hover:border-[var(--text-accent)]/30 transition-colors">
            <span className="text-xs text-[var(--text-secondary)]">{p.chapterTitle}</span>
            <p className="text-xs text-[var(--text-primary)] mt-1 leading-relaxed line-clamp-2">{p.original}…</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
