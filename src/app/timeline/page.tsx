import type { Metadata } from "next";

import Timeline from "@/components/Timeline";
import { buildPageMetadata } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "时间线",
  description:
    "庄子生平与战国大事年表 — 以时间轴串联庄周所处的时代背景、诸子活动与《庄子》文本形成过程。",
  path: "/timeline",
});

export default function TimelinePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          庄子时间线
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          战国风云与庄子生平 · 点击卡片展开详情
        </p>
        <div className="ink-divider" />
      </div>
      <Timeline />
    </div>
  );
}
