"use client";

import dynamic from "next/dynamic";

// d3 力导向图体积大（约300KB），客户端按需加载，避免阻塞概念页首屏
const ThoughtMap = dynamic(() => import("@/components/ThoughtMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] flex items-center justify-center text-sm text-[var(--text-secondary)]">
      加载思想脉络图中…
    </div>
  ),
});

export default function ThoughtMapWrapper() {
  return <ThoughtMap />;
}
