"use client";

import { useEffect } from "react";
import { recordReading } from "./ReadingHistory";

export default function RecordReading({
  chapterId,
  chapterTitle,
}: {
  chapterId: string;
  chapterTitle: string;
}) {
  useEffect(() => {
    recordReading(chapterId, chapterTitle);
  }, [chapterId, chapterTitle]);

  return null;
}
