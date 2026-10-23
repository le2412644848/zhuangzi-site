"use client";

import { useState } from "react";

import type { KaojuEntry } from "@/lib/kaoju-utils";

interface KaojuSectionProps {
  title: string;
  chapterId: string;
  passageId: string;
  /** 条数 —— 服务端算好传入，避免序列化考据全文 */
  count: number;
  /** 取陈鼓应注还是方勇训诂 */
  kind: "chen" | "fang";
}

interface ChapterKaojuData {
  passages?: Record<string, Record<"chen" | "fang", KaojuEntry[] | undefined> | undefined>;
}

/** 篇级考据数据模块级缓存：每个篇章只 fetch 一次网络请求，后续段落直接复用 Promise */
const kaojuDataCache = new Map<string, Promise<ChapterKaojuData | null>>();

function loadChapterKaojuData(chapterId: string): Promise<ChapterKaojuData | null> {
  let p = kaojuDataCache.get(chapterId);
  if (!p) {
    p = fetch(`/data/kaoju/${chapterId}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<ChapterKaojuData>) : null))
      .catch(() => null);
    kaojuDataCache.set(chapterId, p);
  }
  return p;
}

/**
 * 段落级注（折叠区）：陈鼓应注 / 方勇训诂 —— 客户端懒加载。
 *
 * 考据全文由构建脚本拆到 /data/kaoju/<chapterId>.json（篇级一次性下载、
 * 所有段落共享），首屏只出现「N 条」的摘要；展开折叠区时才 fetch。
 * 模块级 Promise 缓存保证同篇章内仅请求一次。折叠交互用原生 <details>。
 */
export default function KaojuSection({ title, chapterId, passageId, count, kind }: KaojuSectionProps) {
  const [entries, setEntries] = useState<KaojuEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const open = e.currentTarget.open;
    if (!open || entries !== null || loading) return;
    setLoading(true);
    try {
      const data = await loadChapterKaojuData(chapterId);
      const list = data?.passages?.[passageId]?.[kind];
      setEntries(list ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <details onToggle={handleToggle} className="mt-4 group/kaoju">
      <summary className="cursor-pointer select-none inline-flex items-center gap-1.5 text-xs text-[var(--text-accent)] hover:underline">
        <svg className="w-3.5 h-3.5 transition-transform group-open/kaoju:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        {title}（{count} 条）
      </summary>
      {loading && (
        <p className="mt-2 pl-3 text-xs text-[var(--text-muted)]">加载注文…</p>
      )}
      {entries && entries.length > 0 && (
        <div className="mt-2 pl-3 border-l-2 border-[var(--border-light)] space-y-2.5">
          {entries.map((e) => (
            <div key={e.seq} className="text-xs leading-relaxed">
              <div className="flex items-baseline gap-1.5">
                <span className="font-medium text-[var(--text-accent)]">{e.term}</span>
                {e.explanation && (
                  <span className="text-[var(--text-primary)]">{e.explanation}</span>
                )}
              </div>
              {e.citations.length > 0 && (
                <div className="mt-1 space-y-1">
                  {e.citations.slice(0, 2).map((c, i) => (
                    <div key={i} className="text-[11px] text-[var(--text-secondary)] leading-snug">
                      <span className="text-[var(--text-accent)] font-medium">{c.author}</span>
                      <span>：</span>
                      <span>{c.quote.length > 80 ? c.quote.slice(0, 80) + "…" : c.quote}</span>
                      {c.source && <span className="text-[var(--text-muted)]">（《{c.source}》）</span>}
                    </div>
                  ))}
                  {e.citations.length > 2 && (
                    <details className="group/cites">
                      <summary className="cursor-pointer text-[11px] text-[var(--text-accent)] hover:underline">
                        查看全部 {e.citations.length} 家注
                      </summary>
                      <div className="mt-1 space-y-1">
                        {e.citations.slice(2).map((c, i) => (
                          <div key={i} className="text-[11px] text-[var(--text-secondary)] leading-snug">
                            <span className="text-[var(--text-accent)] font-medium">{c.author}</span>
                            <span>：</span>
                            <span>{c.quote.length > 80 ? c.quote.slice(0, 80) + "…" : c.quote}</span>
                            {c.source && <span className="text-[var(--text-muted)]">（《{c.source}》）</span>}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {entries && entries.length === 0 && (
        <p className="mt-2 pl-3 text-xs text-[var(--text-muted)]">暂无注文。</p>
      )}
    </details>
  );
}
