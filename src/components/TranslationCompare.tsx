"use client";

import { useState } from "react";

interface TranslationCompareProps {
  chapterId: string;
  passageId: string;
  /** 版本数（含默认白话）—— 服务端算好传入，避免序列化译文全文 */
  count: number;
}

interface Version {
  translator: string;
  text: string;
}

interface TranslationChapterData {
  [passageId: string]:
    | {
        default: string;
        versions?: Version[];
      }
    | undefined;
}

/** 篇级多译本模块级缓存：每个篇章只 fetch 一次网络请求，后续段落直接复用 Promise */
const translationCache = new Map<string, Promise<TranslationChapterData | null>>();

function loadChapterTranslations(chapterId: string): Promise<TranslationChapterData | null> {
  let p = translationCache.get(chapterId);
  if (!p) {
    p = fetch(`/data/translations/${chapterId}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<TranslationChapterData>) : null))
      .catch(() => null);
    translationCache.set(chapterId, p);
  }
  return p;
}

/**
 * 多译本对照 —— 客户端懒加载（章节页首屏减重 v3）。
 *
 * 译本全文（每段 2–4 个版本）由构建脚本拆到
 * /data/translations/<chapterId>.json，首屏只出现「N 个版本」的摘要；
 * 用户展开折叠区时才 fetch 该文件并渲染。服务端直出的默认译文不受影响。
 */
export default function TranslationCompare({ chapterId, passageId, count }: TranslationCompareProps) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const open = e.currentTarget.open;
    if (!open || versions !== null || loading) return;
    setLoading(true);
    try {
      const data = await loadChapterTranslations(chapterId);
      const item = data?.[passageId];
      if (item) {
        setVersions([{ translator: "白话", text: item.default }, ...(item.versions ?? [])]);
      } else {
        setVersions([]);
      }
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <details onToggle={handleToggle} className="mt-3 pt-3 border-t border-[var(--border-light)] group/compare">
      <summary className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-[var(--text-accent)] hover:underline">
        <svg className="w-3 h-3 transition-transform group-open/compare:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        多译本对照（{count} 个版本）
      </summary>
      {loading && (
        <p className="mt-2 pl-3 text-xs text-[var(--text-muted)]">加载译本…</p>
      )}
      {versions && versions.length > 0 && (
        <div className="mt-2 space-y-3">
          {versions.map((v) => (
            <div key={v.translator} className="pl-3 border-l-2 border-[var(--border-color)]">
              <div className="text-xs text-[var(--text-secondary)] mb-1">
                {v.translator}
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed reading-prose">
                {v.text}
              </p>
            </div>
          ))}
        </div>
      )}
      {versions && versions.length === 0 && (
        <p className="mt-2 pl-3 text-xs text-[var(--text-muted)]">暂无其他译本。</p>
      )}
    </details>
  );
}
