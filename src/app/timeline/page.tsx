import type { Metadata } from "next";
import Timeline from "@/components/Timeline";

export const metadata: Metadata = {
  title: "时间线",
};

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
