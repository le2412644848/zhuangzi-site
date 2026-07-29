"use client";

import { useEffect, useRef, useCallback } from "react";
import { recordReading } from "./ReadingHistory";
import { saveProgress, restoreProgress } from "@/lib/reading-progress";

interface Props {
  chapterId: string;
  chapterTitle: string;
  /** Current visible passage ID — pass from parent if you have it */
  currentPassageId?: string;
}

export default function RecordReading({ chapterId, chapterTitle, currentPassageId }: Props) {
  const restored = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      saveProgress(chapterId, chapterTitle, currentPassageId || "");
    }, 2000);
  }, [chapterId, chapterTitle, currentPassageId]);

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
      saveProgress(chapterId, chapterTitle, currentPassageId || "");
    };
  }, [chapterId, chapterTitle, currentPassageId]);

  return null;
}
