"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useMemo } from "react";

function AnnotationsContent() {
  const searchParams = useSearchParams();
  const ch = searchParams.get("ch");
  const p = searchParams.get("p");
  const a = searchParams.get("a");

  const annotation = useMemo(() => {
    if (ch && p && a) {
      // URLSearchParams.get() 已自动解码，这里不能再 decode（含 % 的文本会抛 URIError）
      return { chapterId: ch, passageId: p, text: a };
    }
    return null;
  }, [ch, p, a]);

  if (!annotation) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
        <h1 className="text-3xl font-bold tracking-wide mb-4">共享批注</h1>
        <div className="p-6 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            此页面用于展示他人分享的段落批注。
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            需要包含批注参数的链接才能查看。你可以从任意段落点击分享按钮生成链接。
          </p>
          <Link
            href="/chapters/01-xiaoyao-you"
            className="inline-block mt-4 text-sm text-[var(--text-accent)] hover:underline"
          >
            ← 去阅读逍遥游
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Link
        href="/"
        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
      >
        ← 首页
      </Link>

      <h1 className="text-3xl font-bold tracking-wide mt-4 mb-2">共享批注</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        他人分享的段落批注
      </p>

      <div className="p-6 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]">
        <div className="text-xs text-[var(--text-secondary)] mb-3">
          <Link
            href={`/chapters/${annotation.chapterId}`}
            className="text-[var(--text-accent)] hover:underline"
          >
            {annotation.chapterId.replace("-", "·")}
          </Link>
          {" · "}段落 {annotation.passageId}
        </div>
        <div className="text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--bg-secondary)] rounded p-4">
          {annotation.text}
        </div>
        <Link
          href={`/chapters/${annotation.chapterId}#passage-${annotation.passageId}`}
          className="inline-block mt-4 text-xs text-[var(--text-accent)] hover:underline"
        >
          查看原文 →
        </Link>
      </div>
    </div>
  );
}

export default function AnnotationsPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-12 text-sm text-[var(--text-secondary)]">加载中…</div>}>
      <AnnotationsContent />
    </Suspense>
  );
}
