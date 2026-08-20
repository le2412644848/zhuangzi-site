"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type * as d3Type from "d3";
import { concepts } from "@/data/concepts";

// 力导向图节点/链接类型（替代 any，保证类型安全）
interface MapNode extends d3Type.SimulationNodeDatum {
  id: string;
  name?: string;
  title?: string;
  group: number;
}

interface MapLink extends d3Type.SimulationLinkDatum<MapNode> {
  source: string | MapNode;
  target: string | MapNode;
  value: number;
}

// Build graph data from concepts
const conceptData = concepts.map((c) => ({
  id: c.id,
  name: c.name,
  group: 1,
  description: c.description,
  chapters: c.relatedChapters || [],
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
const nodes: MapNode[] = [
  ...innerChapters.map((ch) => ({ ...ch, group: 0 })),
  ...conceptData.map((c) => ({ id: c.id, name: c.name, group: 1 })),
];

const links: MapLink[] = [];
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
    // 供 cleanup 停止 d3 力模拟（防卸载后空转泄漏）
    let simulation: d3Type.Simulation<MapNode, undefined> | null = null;
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

      // Simulation
      simulation = d3.forceSimulation<MapNode>(nodes)
        .force("link", d3.forceLink<MapNode, MapLink>(links).id((d) => d.id).distance(80))
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
        .selectAll<SVGGElement, MapNode>("g")
        .data(nodes)
        .join("g")
        .call(d3.drag<SVGGElement, MapNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation!.alphaTarget(0.3).restart();
            d.fx = d.x ?? null;
            d.fy = d.y ?? null;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation!.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }));

      // Circles
      node.append("circle")
        .attr("r", (d: MapNode) => d.group === 0 ? 14 : 10)
        .attr("fill", (d: MapNode) => d.group === 0
          ? "var(--text-accent, #8b4513)"
          : "var(--text-secondary, #6b6b6b)")
        .attr("stroke", "var(--bg-card, #fff)")
        .attr("stroke-width", 2);

      // Labels
      node.append("text")
        .text((d: MapNode) => d.name || d.title || "")
        .attr("x", 16)
        .attr("y", 4)
        .attr("font-size", (d: MapNode) => d.group === 0 ? "13px" : "11px")
        .attr("fill", "var(--text-primary)")
        .attr("font-family", "var(--font-serif, serif)");

      // Hover tooltip
      node.on("mouseenter", (event: MouseEvent, d: MapNode) => {
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
      node.on("click", (_event: MouseEvent, d: MapNode) => {
        setSelectedNode(d.id);
      });

      // Tick
      simulation.on("tick", () => {
        link
          .attr("x1", (d: MapLink) => (d.source as MapNode).x ?? 0)
          .attr("y1", (d: MapLink) => (d.source as MapNode).y ?? 0)
          .attr("x2", (d: MapLink) => (d.target as MapNode).x ?? 0)
          .attr("y2", (d: MapLink) => (d.target as MapNode).y ?? 0);
        node.attr("transform", (d: MapNode) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });
    }

    render();
    return () => {
      cancelled = true;
      // 卸载时停止 d3 力模拟计时器（与 KnowledgeGraph 一致，防止空转泄漏）
      try { simulation?.stop(); } catch {}
    };
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
