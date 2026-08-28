"use client";

import { useEffect, useState } from "react";

import { chaptersMeta, passageNumber } from "@/data/chapters/metadata";
import { getProgress } from "@/lib/reading-progress";

/**
 * 篇章列表卡片的「已读进度」徽章 —— 叶子客户端岛。
 * 读 localStorage 的段落级进度（RecordReading 写入），无记录时不渲染
 * （SSR 输出为空，挂载后按客户端状态补上，无 hydration 冲突）。
 */
export default function ChapterProgressBadge({ chapterId }: { chapterId: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    // 挂载后读进度（hydration-safe；localStorage 只在客户端存在）
    const entry = getProgress(chapterId);
    if (!entry || !entry.passageId) return;
    const num = passageNumber(chapterId, entry.passageId);
    const total = chaptersMeta.find((c) => c.id === chapterId)?.passageCount ?? 0;
    if (!num || num < 1) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(num >= total ? "已读完" : `读至第${num}节`);
  }, [chapterId]);

  if (!label) return null;

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--text-accent)]/8 text-[var(--text-accent)] border border-[var(--text-accent)]/20">
      {label}
    </span>
  );
}
