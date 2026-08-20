"use client";

import { useEffect, useRef } from "react";
import type * as d3Type from "d3";
import { concepts } from "@/data/concepts";
import { useRouter } from "next/navigation";

interface GraphNode extends d3Type.SimulationNodeDatum {
  id: string;
  name: string;
}

interface GraphLink extends d3Type.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!svgRef.current || !containerRef.current) return;
      const d3 = await import("d3");
      if (cancelled) return;

      const svg = d3.select(svgRef.current);
      const container = containerRef.current;

    // Clear previous content
    svg.selectAll("*").remove();

    // Build nodes
    const nodes: GraphNode[] = concepts.map((c) => ({
      id: c.id,
      name: c.name,
    }));

    // Build links - create a Set of all valid concept IDs for quick lookup
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Collect directed links where both source and target exist
    const linkSet = new Set<string>();
    const links: GraphLink[] = [];

    concepts.forEach((c) => {
      c.relatedConcepts.forEach((targetId) => {
        if (nodeIds.has(targetId)) {
          // Use a canonical key to avoid duplicates
          const key = [c.id, targetId].sort().join("---");
          if (!linkSet.has(key)) {
            linkSet.add(key);
            links.push({ source: c.id, target: targetId });
          }
        }
      });
    });

    // Dimensions
    const width = Math.max(800, container.clientWidth);
    const height = 500;

    svg.attr("viewBox", [0, 0, width, height]);

    // Create a defs for arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "var(--text-secondary)");

    // Zoom behavior
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Draw links
    const link = g
      .append("g")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", "var(--text-secondary)")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Draw nodes
    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
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
          })
      )
      .on("click", (_event, d) => {
        router.push("/concepts/" + d.id);
      });

    // Node circles
    node
      .append("circle")
      .attr("r", 12)
      .attr("fill", "var(--text-accent)")
      .attr("stroke", "var(--bg-primary)")
      .attr("stroke-width", 2);

    // Node labels
    node
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", 28)
      .attr("fill", "var(--text-primary)")
      .attr("font-size", "13px")
      .attr("font-weight", "500")
      .style("pointer-events", "none");

    // Tick handler
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      node.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")");
    });

    return simulation;
    }

    let simulation: d3Type.Simulation<GraphNode, undefined> | null = null;
    render().then((sim) => { if (sim) simulation = sim; });

    return () => {
      cancelled = true;
      simulation?.stop();
    };
  }, [router]);

  return (
    <div ref={containerRef} className="w-full">
      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: "500px", minHeight: "500px" }}
      />
    </div>
  );
}
