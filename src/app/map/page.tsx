import type { Metadata } from "next";

import MapWrapper from "@/components/MapWrapper";
import { buildPageMetadata } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "庄子地理",
  description:
    "《庄子》地理图 — 蒙城、濮水、濠梁等文中地名的今地考订与位置标注，还原庄周活动范围与寓言发生地。",
  path: "/map",
});

export default function MapPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif bg-[var(--text-accent)]/10 text-[var(--text-accent)] mb-3">
          <span className="seal-char" aria-hidden="true">輿</span>
          战国风云与文人行迹
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-serif tracking-[0.04em] text-[var(--text-primary)] mb-3">
          庄子地理考据舆图
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-serif max-w-xl mx-auto leading-relaxed">
          太史公曰：「庄子者，蒙人也，名周。尝为蒙漆园吏，与梁惠王、齐宣王同时。」
          以水墨舆图钩沉蒙邑、濮水、濠梁、大梁之游历足迹与原典篇章。
        </p>
        <div className="ink-divider max-w-xs mx-auto mt-4" />
      </div>
      <MapWrapper />
    </div>
  );
}
