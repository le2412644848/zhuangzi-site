"use client";

import { useMemo } from "react";
import { pinyin } from "pinyin-pro";
import { classicalPinyin } from "@/data/classical-pinyin";

interface PinyinAnnotatorProps {
  text: string;
  enabled?: boolean;
}

export default function PinyinAnnotator({ text, enabled = true }: PinyinAnnotatorProps) {
  const annotated = useMemo(() => {
    if (!enabled) return text;
    const chars = [...text];
    return chars.map((char, i) => {
      // Skip non-CJK
      if (!/[\p{Script=Han}]/u.test(char)) return char;

      // Check classical override first
      let py = classicalPinyin[char];
      if (!py) {
        py = pinyin(char, { toneType: "symbol", type: "array" })[0];
      }
      if (!py) return char;

      return (
        <ruby key={i} className="pinyin-annotated">
          {char}
          <rt>{py}</rt>
        </ruby>
      );
    });
  }, [text, enabled]);

  return <>{annotated}</>;
}
