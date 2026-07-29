"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { concepts } from "@/data/concepts";

// Concept-to-chapter mapping (which chapters discuss each concept)
interface ConceptNode {
  id: string;
  name: string;
  group: number;
}

interface ChapterNode {
  id: string;
  title: string;
  group: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

// Build graph data from concepts
const conceptData = concepts.map((c, i) => ({
  id: c.id,
  name: c.name,
  group: 1,
  description: c.description,
  chapters: (c as unknown as { relatedChapters?: string[] }).relatedChapters || [],
}));

const innerChapters = [
  { id: "01-xiaoyao-you", title: "逍遥游" },
  { id: "02-qiwu-lun", title: "齐物论" },
  { id: "03-yangsheng-zhu", title: "养生主" },
  { id: "04-renjian-shi", title: "人间世" },
  { id: "05-dechong-fu", title: "德充符" },
  { id: "06-dazong-shi", title: "大宗师" },
  { id: "07-yingdi-wang", title: "应帝王" },
];

// Build links: connect concepts to their related inner chapters
const nodes = [
  ...innerChapters.map((ch) => ({ ...ch, group: 0 })),
  ...conceptData.map((c) => ({ id: c.id, name: c.name, group: 1 })),
];

const links: { source: string; target: string; value: number }[] = [];
for (const c of conceptData) {
  for (const chId of c.chapters) {
    if (innerChapters.some((ic) => ic.id === chId)) {
      links.push({ source: c.id, target: chId, value: 1 });
    }
  }
}

export default function ThoughtMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; desc: string } | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    async function render() {
      const d3 = await import("d3");
      if (cancelled) return;
      if (!container) return;

      const width = container.clientWidth || 700;
      const height = 500;

      // Clear previous
      container.innerHTML = "";

      const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

      // Color scale
      const color = d3.scaleOrdinal<string>()
        .domain(["0", "1"])
        .range(["var(--color-accent, #8b4513)", "var(--color-ink-light, #6b6b6b)"]);

      // Simulation
      const simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(30));

      // Links
      const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "var(--border-color, #d4c9b8)")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.6);

      // Nodes
      const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag<any, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any);

      // Circles
      node.append("circle")
        .attr("r", (d: any) => d.group === 0 ? 14 : 10)
        .attr("fill", (d: any) => d.group === 0
          ? "var(--text-accent, #8b4513)"
          : "var(--text-secondary, #6b6b6b)")
        .attr("stroke", "var(--bg-card, #fff)")
        .attr("stroke-width", 2);

      // Labels
      node.append("text")
        .text((d: any) => d.name || d.title)
        .attr("x", 16)
        .attr("y", 4)
        .attr("font-size", (d: any) => d.group === 0 ? "13px" : "11px")
        .attr("fill", "var(--text-primary)")
        .attr("font-family", "var(--font-serif, serif)");

      // Hover tooltip
      node.on("mouseenter", (event: any, d: any) => {
        const concept = conceptData.find((c) => c.id === d.id);
        if (concept) {
          setTooltip({
            x: event.clientX,
            y: event.clientY,
            name: concept.name,
            desc: concept.description || '',
          });
        }
      }).on("mouseleave", () => setTooltip(null));

      // Click to select
      node.on("click", (_event: any, d: any) => {
        setSelectedNode(d.id);
      });

      // Tick
      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);
        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });
    }

    render();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full h-[500px] rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden" />
      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg max-w-xs"
          style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}>
          <div className="text-sm font-medium text-[var(--text-accent)]">{tooltip.name}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">{tooltip.desc}</div>
        </div>
      )}
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[var(--text-accent)]" />
          <span>内篇七章</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[var(--text-secondary)]" />
          <span>核心概念</span>
        </div>
        <span className="text-[var(--border-color)]">|</span>
        <span>拖拽节点 · 悬停查看概念详情</span>
      </div>
      {/* Quick links */}
      {selectedNode && (
        <div className="mt-3 flex gap-2">
          {conceptData.find((c) => c.id === selectedNode) ? (
            <Link href={`/concepts/${selectedNode}`}
              className="text-xs text-[var(--text-accent)] hover:underline">
              → 查看概念详情
            </Link>
          ) : innerChapters.find((c) => c.id === selectedNode) ? (
            <Link href={`/chapters/${selectedNode}`}
              className="text-xs text-[var(--text-accent)] hover:underline">
              → 阅读篇章
            </Link>
          ) : null}
          <button onClick={() => setSelectedNode(null)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            取消
          </button>
        </div>
      )}
    </div>
  );
}
