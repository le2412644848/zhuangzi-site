"use client";

import { useCallback,useEffect, useRef } from "react";

import { restoreProgress,saveProgress } from "@/lib/reading-progress";

import { recordReading } from "./ReadingHistory";

interface Props {
  chapterId: string;
  chapterTitle: string;
}

/**
 * 阅读进度记录（章节级历史 + 段落级续读）。
 *
 * 像素级滚动恢复一直存在，但 restoreProgress 的「段落锚点优先」分支
 * 从未生效 —— 旧实现的 currentPassageId 是可选 prop，而章节页从不传，
 * saveProgress 存进去的 passageId 恒为空串。现在用 IntersectionObserver
 * 在组件内部跟踪当前可见段落（观察参数与 ChapterTOC 的 scroll spy 一致），
 * 无需页面传 prop；刷新/重进页面时恢复到段落锚点而非像素位置。
 */
export default function RecordReading({ chapterId, chapterTitle }: Props) {
  const restored = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const passageRef = useRef("");

  // 跟踪当前视口内的段落 id（写入 passageRef 供滚动保存使用）
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            passageRef.current = entry.target.id.replace(/^passage-/, "");
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    document.querySelectorAll<HTMLElement>('[id^="passage-"]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Restore scroll position on first mount
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    recordReading(chapterId, chapterTitle);

    // Delay restore slightly to let DOM settle
    const raf = requestAnimationFrame(() => {
      restoreProgress(chapterId);
    });
    return () => cancelAnimationFrame(raf);
  }, [chapterId, chapterTitle]);

  // Save progress on scroll (debounced)
  const handleScroll = useCallback(() => {
    if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveProgress(chapterId, chapterTitle, passageRef.current);
    }, 2000);
  }, [chapterId, chapterTitle]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    };
  }, [handleScroll]);

  // Also save on unmount (tab close / navigation)
  useEffect(() => {
    return () => {
      saveProgress(chapterId, chapterTitle, passageRef.current);
    };
  }, [chapterId, chapterTitle]);

  return null;
}
