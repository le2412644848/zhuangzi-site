"use client";

import dynamic from "next/dynamic";

const MapComp = dynamic(() => import("@/components/ZhuangziMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center text-sm text-[var(--text-secondary)]">
      加载地图中…
    </div>
  ),
});

export default function MapWrapper() {
  return <MapComp />;
}
