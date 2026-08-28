"use client";

import { useMemo, useState } from "react";

import timelineData from "@/data/timeline.json";

interface TimelineEvent {
  year: string;
  yearSort: number;
  event: string;
  description: string;
  category: string;
}

// 2026-08-24 视觉复审：原 #3b82f6/#22c55e 高饱和蓝绿跳出全站水墨调色板，
// 改为降饱和的靛灰（战国）与竹绿（人物），与赭石（生平）成三色系。
const categoryStyles: Record<string, { border: string; bg: string; dot: string }> = {
  "庄子生平": { border: "var(--text-accent)", bg: "rgba(139,94,60,0.06)", dot: "var(--text-accent)" },
  "战国事件": { border: "#6E7F92", bg: "rgba(110,127,146,0.07)", dot: "#6E7F92" },
  "人物": { border: "#7C8B6F", bg: "rgba(124,139,111,0.07)", dot: "#7C8B6F" },
};

export default function Timeline() {
  const [filter, setFilter] = useState<string>("全部");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const data = timelineData as TimelineEvent[];
    if (filter === "全部") return data.sort((a, b) => a.yearSort - b.yearSort);
    return data.filter((e) => e.category === filter).sort((a, b) => a.yearSort - b.yearSort);
  }, [filter]);

  const filters = ["全部", "庄子生平", "战国事件", "人物"];

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filter === f
                ? "border-[var(--text-accent)] text-[var(--text-accent)] bg-[var(--text-accent)]/10"
                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-[var(--border-color)] -translate-x-1/2" />

        {/* 2026-08-24 视觉复审：space-y-8 → 4，交错布局本身已有呼吸感，
            原行距把 24 条事件拉到 3000+px */}
        <div className="space-y-4">
          {filtered.map((event, idx) => {
            const isLeft = idx % 2 === 0;
            const isExpanded = expanded === `${event.year}-${event.event}`;

            return (
              <div
                key={`${event.year}-${event.event}`}
                className={`relative flex items-start gap-4 sm:gap-8 ${
                  isLeft ? "sm:flex-row" : "sm:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-4 sm:left-1/2 w-3 h-3 rounded-full -translate-x-1/2 z-10 border-2 border-white dark:border-[var(--bg-primary)] shadow-sm"
                  style={{ backgroundColor: categoryStyles[event.category]?.dot || "#9ca3af" }}
                />

                {/* Spacer */}
                <div className="hidden sm:block sm:w-1/2" />

                {/* Card */}
                <div className={`ml-8 sm:ml-0 sm:w-1/2 ${isLeft ? "sm:pr-8" : "sm:pl-8"}`}>
                  <div
                    onClick={() => setExpanded(isExpanded ? null : `${event.year}-${event.event}`)}
                    className="p-3 sm:p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-sm bg-[var(--bg-card)]"
                    style={{
                      borderLeftColor: categoryStyles[event.category]?.border || "#d1d5db",
                      backgroundColor: categoryStyles[event.category]?.bg || "var(--bg-card)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        {event.year}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)]">
                        {event.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">
                      {event.event}
                    </h3>
                    {isExpanded && (
                      <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
