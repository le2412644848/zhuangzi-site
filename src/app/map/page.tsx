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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          庄子地理
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          战国风云中庄子的足迹
        </p>
        <div className="ink-divider" />
      </div>
      <MapWrapper />
    </div>
  );
}
