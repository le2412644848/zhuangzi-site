"use client";

import type * as d3Type from "d3";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { concepts } from "@/data/concepts";

interface MapNode extends d3Type.SimulationNodeDatum {
  id: string;
  name: string;
  title: string;
  group: number; // 0: 内篇中枢, 1: 核心概念
  summary: string;
  description?: string | undefined;
  relatedIds: string[];
}

interface MapLink extends d3Type.SimulationLinkDatum<MapNode> {
  source: string | MapNode;
  target: string | MapNode;
  value: number;
  type?: "chapter-concept" | "concept-concept" | "chapter-axis";
}

const INNER_CHAPTERS: Array<{
  id: string;
  title: string;
  summary: string;
}> = [
  {
    id: "01-xiaoyao-you",
    title: "逍遥游",
    summary:
      "开宗明义，阐发『无所待』之绝对精神自由。乘天地之正，御六气之辩，终归于无用之大用。",
  },
  {
    id: "02-qiwu-lun",
    title: "齐物论",
    summary:
      "认识论枢机，吾丧我以破成心是非，天地与我并生，万物与我为一，庄周梦蝶消解二元对立。",
  },
  {
    id: "03-yangsheng-zhu",
    title: "养生主",
    summary:
      "生命智慧之本，庖丁解牛游刃于无厚入有间，顺依天理以全生尽年。",
  },
  {
    id: "04-renjian-shi",
    title: "人间世",
    summary:
      "涉世处乱之方，唯道集虚，虚室生白，心斋坐忘以安之若命。",
  },
  {
    id: "05-dechong-fu",
    title: "德充符",
    summary:
      "内在德性之充溢，忘形骸而得真知，哀乐不能入，游于物之所不得遁而皆存。",
  },
  {
    id: "06-dazong-shi",
    title: "大宗师",
    summary:
      "以道为师之真人境界，相忘于江湖，知天之所为，知人之所为，同于大通。",
  },
  {
    id: "07-yingdi-wang",
    title: "应帝王",
    summary:
      "政治哲学巅峰，顺物自然而无容私，至人之用心若镜，不将不迎，应而不藏。",
  },
];

export default function ThoughtMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string>("01-xiaoyao-you");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 整理节点和边
  const { allNodes, allLinks } = useMemo(() => {
    const rawNodes: MapNode[] = [];
    const rawLinks: MapLink[] = [];

    // 1. 内篇 7 章节点
    INNER_CHAPTERS.forEach((ch) => {
      // 找出所有关联此篇的概念 ID
      const relatedConceptIds = concepts
        .filter((c) => c.relatedChapters?.includes(ch.id))
        .map((c) => c.id);

      rawNodes.push({
        id: ch.id,
        name: ch.title,
        title: ch.title,
        group: 0,
        summary: ch.summary,
        relatedIds: relatedConceptIds,
      });
    });

    // 2. 核心概念节点
    concepts.forEach((c) => {
      const relatedChapters = c.relatedChapters?.filter((chId) =>
        INNER_CHAPTERS.some((ic) => ic.id === chId)
      ) || [];
      const relatedConcepts = c.relatedConcepts || [];

      rawNodes.push({
        id: c.id,
        name: c.name,
        title: c.name,
        group: 1,
        summary: c.summary || c.description?.slice(0, 80) || "",
        description: c.description,
        relatedIds: [...relatedChapters, ...relatedConcepts],
      });

      // 概念与内篇连线
      relatedChapters.forEach((chId) => {
        rawLinks.push({
          source: c.id,
          target: chId,
          value: 1,
          type: "chapter-concept",
        });
      });

      // 概念间连线（避免重复加线）
      relatedConcepts.forEach((otherId) => {
        if (otherId > c.id && concepts.some((o) => o.id === otherId)) {
          rawLinks.push({
            source: c.id,
            target: otherId,
            value: 0.5,
            type: "concept-concept",
          });
        }
      });
    });

    // 3. 内篇脉络主轴弱连线
    for (let i = 0; i < INNER_CHAPTERS.length - 1; i++) {
      rawLinks.push({
        source: INNER_CHAPTERS[i]!.id,
        target: INNER_CHAPTERS[i + 1]!.id,
        value: 0.8,
        type: "chapter-axis",
      });
    }

    return { allNodes: rawNodes, allLinks: rawLinks };
  }, []);

  // 活跃焦点（选中的优先，其次是悬停的）
  const activeFocusId = hoveredId || selectedId;

  // 计算当前聚焦节点的相连节点集合
  const activeNeighborSet = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const neighbors = new Set<string>([activeFocusId]);
    allLinks.forEach((link) => {
      const sId = typeof link.source === "object" ? link.source.id : link.source;
      const tId = typeof link.target === "object" ? link.target.id : link.target;
      if (sId === activeFocusId) neighbors.add(tId);
      if (tId === activeFocusId) neighbors.add(sId);
    });
    return neighbors;
  }, [activeFocusId, allLinks]);

  // 当前选中节点的信息
  const selectedNodeInfo = useMemo(() => {
    return allNodes.find((n) => n.id === selectedId) || null;
  }, [allNodes, selectedId]);

  // 关联节点胶囊列表
  const relatedNodeList = useMemo(() => {
    if (!selectedNodeInfo) return [];
    return allNodes.filter(
      (n) => n.id !== selectedNodeInfo.id && selectedNodeInfo.relatedIds.includes(n.id)
    );
  }, [allNodes, selectedNodeInfo]);

  // 渲染 D3 力导向图
  useEffect(() => {
    let cancelled = false;
    let simulation: d3Type.Simulation<MapNode, undefined> | null = null;
    const container = containerRef.current;
    if (!container) return;

    async function init() {
      const d3 = await import("d3");
      if (cancelled || !container) return;

      const width = container.clientWidth || 760;
      const height = 560;

      container.innerHTML = "";

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; cursor: grab;");

      const gRoot = svg.append("g").attr("class", "zoom-layer");

      // 缩放与平移支持
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.6, 2.8])
        .on("zoom", (event) => {
          gRoot.attr("transform", event.transform);
        });
      svg.call(zoom);

      // ===== 绘制背景：太极三环罗盘与星轨虚线 =====
      const centerX = width / 2;
      const centerY = height / 2;
      const gCompass = gRoot.append("g").attr("class", "compass-bg").attr("pointer-events", "none");

      // 罗盘内环（内篇中枢环，约半径 120）
      gCompass
        .append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", 125)
        .attr("fill", "none")
        .attr("stroke", "var(--border-color, #8e5431)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4")
        .attr("opacity", 0.28);

      // 罗盘外环（哲学范畴星群环，约半径 220）
      gCompass
        .append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", 225)
        .attr("fill", "none")
        .attr("stroke", "var(--border-color, #8e5431)")
        .attr("stroke-width", 0.8)
        .attr("stroke-dasharray", "6 6")
        .attr("opacity", 0.2);

      // 罗盘同心微环
      gCompass
        .append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", 40)
        .attr("fill", "none")
        .attr("stroke", "var(--border-color, #8e5431)")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.15);

      // 罗盘四象十字微刻度
      gCompass
        .append("line")
        .attr("x1", centerX - 240)
        .attr("y1", centerY)
        .attr("x2", centerX + 240)
        .attr("y2", centerY)
        .attr("stroke", "var(--border-color, #8e5431)")
        .attr("stroke-width", 0.5)
        .attr("stroke-dasharray", "3 5")
        .attr("opacity", 0.18);

      gCompass
        .append("line")
        .attr("x1", centerX)
        .attr("y1", centerY - 240)
        .attr("x2", centerX)
        .attr("y2", centerY + 240)
        .attr("stroke", "var(--border-color, #8e5431)")
        .attr("stroke-width", 0.5)
        .attr("stroke-dasharray", "3 5")
        .attr("opacity", 0.18);

      // 创建深拷贝数据，避免 d3 突变原数据
      const simNodes: MapNode[] = allNodes.map((d) => ({ ...d }));
      const simLinks: MapLink[] = allLinks.map((d) => ({ ...d }));

      // 力导向模拟器：结合太极双环径向引力（内篇居内环 r=110，概念居外环 r=210），彻底消除标签碰撞
      simulation = d3
        .forceSimulation<MapNode>(simNodes)
        .force(
          "link",
          d3
            .forceLink<MapNode, MapLink>(simLinks)
            .id((d) => d.id)
            .distance((d) => (d.type === "chapter-axis" ? 85 : 110))
            .strength(0.25)
        )
        .force("charge", d3.forceManyBody().strength(-180))
        .force("center", d3.forceCenter(centerX, centerY))
        .force(
          "radial",
          d3.forceRadial<MapNode>((d) => (d.group === 0 ? 105 : 210), centerX, centerY).strength(0.82)
        )
        .force("collision", d3.forceCollide<MapNode>().radius((d) => (d.group === 0 ? 42 : 30)));

      // 边图元容器
      const linkG = gRoot.append("g").attr("class", "links");
      const linkElements = linkG
        .selectAll<SVGLineElement, MapLink>("line")
        .data(simLinks)
        .join("line")
        .attr("stroke", "var(--border-color, #d4c9b8)")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.45);

      // 节点图元容器
      const nodeG = gRoot.append("g").attr("class", "nodes");
      const nodeElements = nodeG
        .selectAll<SVGGElement, MapNode>("g")
        .data(simNodes)
        .join("g")
        .attr("class", "node-group")
        .attr("cursor", "pointer")
        .call(
          d3
            .drag<SVGGElement, MapNode>()
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
            })
        );

      // 外光晕（选中高亮金边环）
      nodeElements
        .append("circle")
        .attr("class", "halo-ring")
        .attr("r", (d) => (d.group === 0 ? 22 : 16))
        .attr("fill", "none")
        .attr("stroke", "#d4a359")
        .attr("stroke-width", 2.5)
        .attr("opacity", 0);

      // 主圆
      nodeElements
        .append("circle")
        .attr("class", "main-circle")
        .attr("r", (d) => (d.group === 0 ? 16 : 10))
        .attr("fill", (d) =>
          d.group === 0 ? "var(--color-accent-vermilion, #b83b2e)" : "var(--text-accent, #8b4513)"
        )
        .attr("stroke", "var(--bg-card, #faf8f4)")
        .attr("stroke-width", 2)
        .attr("box-shadow", "0 2px 6px rgba(0,0,0,0.2)");

      // 铭文标签（居中置于星印下方，避免水平遮挡邻近节点）
      nodeElements
        .append("text")
        .text((d) => d.name)
        .attr("x", 0)
        .attr("y", (d) => (d.group === 0 ? 30 : 22))
        .attr("text-anchor", "middle")
        .attr("font-size", (d) => (d.group === 0 ? "13px" : "11px"))
        .attr("font-weight", (d) => (d.group === 0 ? "bold" : "500"))
        .attr("fill", "var(--text-primary, #231c14)")
        .attr("font-family", "var(--font-serif, serif)")
        .attr("letter-spacing", "0.04em");

      // 交互事件
      nodeElements
        .on("mouseenter", (_event, d) => {
          setHoveredId(d.id);
        })
        .on("mouseleave", () => {
          setHoveredId(null);
        })
        .on("click", (_event, d) => {
          setSelectedId(d.id);
        });

      // 渲染帧 Tick
      simulation.on("tick", () => {
        linkElements
          .attr("x1", (d) => (d.source as MapNode).x ?? 0)
          .attr("y1", (d) => (d.source as MapNode).y ?? 0)
          .attr("x2", (d) => (d.target as MapNode).x ?? 0)
          .attr("y2", (d) => (d.target as MapNode).y ?? 0);

        nodeElements.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

      // 暴露给外部样式更新的引用
      (container as unknown as {
        _updateHighlight?: (
          focusId: string | null,
          selId: string,
          neighSet: Set<string>,
          hovId: string | null
        ) => void;
      })._updateHighlight = (focusId, selId, neighSet, hovId) => {
        // 更新连线高亮
        linkElements.each(function (d) {
          const sId = typeof d.source === "object" ? d.source.id : d.source;
          const tId = typeof d.target === "object" ? d.target.id : d.target;
          const isRelated = focusId && (sId === focusId || tId === focusId);

          if (focusId) {
            if (isRelated) {
              d3.select(this)
                .attr("stroke", "var(--color-accent-vermilion, #b83b2e)")
                .attr("stroke-width", 2.2)
                .attr("stroke-opacity", 0.95);
            } else {
              d3.select(this)
                .attr("stroke", "var(--border-color, #d4c9b8)")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.08);
            }
          } else {
            d3.select(this)
              .attr("stroke", "var(--border-color, #d4c9b8)")
              .attr("stroke-width", 1)
              .attr("stroke-opacity", 0.45);
          }
        });

        // 更新节点高亮与宣纸金光
        nodeElements.each(function (d) {
          const isSelected = d.id === selId;
          const isNeighbor = neighSet.has(d.id);

          const el = d3.select(this);
          const halo = el.select<SVGCircleElement>(".halo-ring");

          if (focusId) {
            if (isNeighbor) {
              el.attr("opacity", 1);
            } else {
              el.attr("opacity", 0.18);
            }
          } else {
            el.attr("opacity", 1);
          }

          if (isSelected) {
            halo.attr("opacity", 0.9).attr("stroke", "#d4a359");
          } else if (d.id === hovId) {
            halo.attr("opacity", 0.5).attr("stroke", "var(--text-accent)");
          } else {
            halo.attr("opacity", 0);
          }
        });
      };
    }

    void init();

    return () => {
      cancelled = true;
      try {
        simulation?.stop();
      } catch {}
    };
  }, [allNodes, allLinks]);

  // 当焦点变化时触发 D3 图元高亮
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      (
        container as unknown as {
          _updateHighlight?: (
            f: string | null,
            s: string,
            n: Set<string>,
            h: string | null
          ) => void;
        }
      )._updateHighlight?.(activeFocusId, selectedId, activeNeighborSet, hoveredId);
    }
  }, [selectedId, hoveredId, activeNeighborSet, activeFocusId]);

  // 点击胶囊快速聚焦切换
  const handleSelectCapsule = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* 思想星图主体画布 */}
      <div className="relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
        {/* 顶部小标与图例 */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-wrap items-center gap-3 bg-[var(--bg-card)]/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[var(--border-light)] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-serif text-[var(--text-primary)]">
            <span className="w-3.5 h-3.5 rounded-full bg-[var(--color-accent-vermilion,#b83b2e)] border border-[var(--bg-card)] shadow-xs" />
            <span>内篇七章中枢（朱砂印）</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-serif text-[var(--text-primary)]">
            <span className="w-3 h-3 rounded-full bg-[var(--text-accent)] border border-[var(--bg-card)] shadow-xs" />
            <span>核心哲学范畴（金珀圆）</span>
          </div>
          <span className="text-[var(--border-color)] hidden sm:inline">|</span>
          <span className="text-[11px] font-serif text-[var(--text-muted)] hidden sm:inline">
            滚轮缩放 · 拖拽平移 · 点击聚焦
          </span>
        </div>

        {/* 罗盘底纹图签 */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <button
            type="button"
            onClick={() => setSelectedId("01-xiaoyao-you")}
            className="px-2.5 py-1 rounded text-xs font-serif border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shadow-xs"
          >
            重置内篇中枢
          </button>
        </div>

        {/* D3 容器 */}
        <div ref={containerRef} className="w-full h-[460px] sm:h-[560px]" />
      </div>

      {/* 底部：选中节点深度详情考释匣 */}
      {selectedNodeInfo && (
        <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-serif font-semibold border ${
                    selectedNodeInfo.group === 0
                      ? "bg-[var(--color-accent-vermilion,#b83b2e)]/10 text-[var(--color-accent-vermilion,#b83b2e)] border-[var(--color-accent-vermilion,#b83b2e)]/30"
                      : "bg-[var(--text-accent)]/10 text-[var(--text-accent)] border-[var(--text-accent)]/30"
                  }`}
                >
                  {selectedNodeInfo.group === 0 ? "内篇中枢 · 七篇首脑" : "核心哲学范畴 · 义理发微"}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-serif">
                  关联网目 {relatedNodeList.length} 处
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-[var(--text-primary)] tracking-wide">
                {selectedNodeInfo.group === 0 ? `《${selectedNodeInfo.title}》` : selectedNodeInfo.name}
              </h3>
            </div>

            {/* 一键直达深入研读入口 */}
            <div className="shrink-0 flex items-center gap-2">
              {selectedNodeInfo.group === 0 ? (
                <Link
                  href={`/chapters/${selectedNodeInfo.id}`}
                  className="px-4 py-2 rounded-lg bg-[var(--color-accent-vermilion,#b83b2e)] text-[#ffffff] hover:opacity-90 text-xs font-serif font-medium transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>展卷读原典</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <Link
                  href={`/concepts/${selectedNodeInfo.id}`}
                  className="px-4 py-2 rounded-lg bg-[var(--text-accent)] text-[var(--btn-accent-text,#ffffff)] hover:opacity-90 text-xs font-serif font-medium transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>深研概念考释</span>
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>

          {/* 释义文字 */}
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-serif mb-5">
            {selectedNodeInfo.description || selectedNodeInfo.summary}
          </p>

          {/* 关联网目胶囊标签 */}
          {relatedNodeList.length > 0 && (
            <div className="pt-4 border-t border-[var(--border-light)]">
              <div className="text-xs font-serif font-medium text-[var(--text-secondary)] mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-vermilion,#b83b2e)]" />
                <span>思想脉络连缀（点击即刻切换星图焦点）：</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedNodeList.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => handleSelectCapsule(rel.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-serif border transition-all cursor-pointer flex items-center gap-1.5 ${
                      rel.group === 0
                        ? "border-[var(--color-accent-vermilion,#b83b2e)]/40 bg-[var(--color-accent-vermilion,#b83b2e)]/5 text-[var(--color-accent-vermilion,#b83b2e)] hover:bg-[var(--color-accent-vermilion,#b83b2e)]/15"
                        : "border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--text-accent)] hover:text-[var(--text-accent)]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        rel.group === 0
                          ? "bg-[var(--color-accent-vermilion,#b83b2e)]"
                          : "bg-[var(--text-accent)]"
                      }`}
                    />
                    <span>{rel.group === 0 ? `《${rel.title}》` : rel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
