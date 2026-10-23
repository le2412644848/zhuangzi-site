"use client";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import rawLocations from "@/data/map-locations.json";

export interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  desc: string;
  chapter: string;
  chapterId: string;
  event: string;
  quote: string;
  state: string;
  year: string;
}

const locations: MapLocation[] = rawLocations as MapLocation[];

// 庄子核心游历足迹轨迹点：蒙（宋）→ 濮水 → 大梁（魏）→ 濠水 → 郢都（楚）
const TRAVEL_TRACK: [number, number][] = [
  [34.42, 115.65], // 蒙
  [35.8, 115.2],   // 濮水
  [34.8, 114.3],   // 大梁
  [32.9, 117.5],   // 濠水
  [30.4, 112.2],   // 郢都
];

// 创建宋刻朱印地标 DivIcon
function createSealIcon(name: string, isSelected: boolean) {
  const shortName = name.split("（")[0] || name;
  const sealChar = shortName.slice(0, 1);
  return L.divIcon({
    className: "zz-custom-pin-wrap",
    html: `
      <div class="zz-custom-pin ${isSelected ? "is-selected" : ""}">
        <span class="zz-pin-seal">${sealChar}</span>
        <span class="zz-pin-badge">${name}</span>
      </div>
    `,
    iconSize: [120, 28],
    iconAnchor: [12, 14],
    popupAnchor: [0, -14],
  });
}

const STATES = ["全部", "宋国", "楚国", "魏国", "齐国", "赵国", "秦国"];
const PERIODS = ["全部", "早年故里", "漆园任吏", "辞聘隐逸", "濠梁论道", "游历辩难"];

export default function ZhuangziMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const [selectedId, setSelectedId] = useState<string>("meng");
  const [filterState, setFilterState] = useState<string>("全部");
  const [filterPeriod, setFilterPeriod] = useState<string>("全部");

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchState = filterState === "全部" || loc.state === filterState;
      const matchPeriod = filterPeriod === "全部" || loc.year === filterPeriod;
      return matchState && matchPeriod;
    });
  }, [filterState, filterPeriod]);

  const selectedLoc = useMemo(
    () => locations.find((l) => l.id === selectedId) ?? locations[0],
    [selectedId]
  );

  // 初始化地图
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([34.5, 114], 6);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // 高德瓦片（国内稳定加速）
    L.tileLayer(
      "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
      {
        subdomains: ["1", "2", "3", "4"],
        attribution: "© 高德地图 · 战国古舆水墨设色",
        maxZoom: 18,
      }
    ).addTo(map);

    // 绘制庄子核心游历行迹虚线轨
    L.polyline(TRAVEL_TRACK, {
      color: "#b83b2e",
      weight: 2,
      dashArray: "6 6",
      opacity: 0.7,
    }).addTo(map);

    mapInstanceRef.current = map;

    // 解决动态载入后瓦片尺寸未铺满
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 当地点、筛选或选中项变化时刷新标记
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 清理旧标记
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // 绘制符合筛选条件的标记
    filteredLocations.forEach((loc) => {
      const isSelected = loc.id === selectedId;
      const marker = L.marker([loc.lat, loc.lng], {
        icon: createSealIcon(loc.name, isSelected),
        title: loc.name,
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(map);

      marker.on("click", () => {
        setSelectedId(loc.id);
        map.flyTo([loc.lat, loc.lng], 7, { duration: 0.9 });
      });

      markersRef.current.set(loc.id, marker);
    });
  }, [filteredLocations, selectedId]);

  // 选择某个地标并飞行
  const handleSelectLocation = (loc: MapLocation) => {
    setSelectedId(loc.id);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([loc.lat, loc.lng], 7, { duration: 0.9 });
    }
  };

  // 重置全境视角
  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([34.5, 114], 6, { duration: 0.8 });
    }
  };

  return (
    <div className="zhuangzi-map-wrapper w-full">
      {/* 注入古籍水墨设色滤镜与印章样式 */}
      <style jsx global>{`
        .zhuangzi-map-wrapper .leaflet-tile-pane {
          filter: sepia(0.55) contrast(0.95) saturate(0.55) brightness(0.96) !important;
        }
        .zz-custom-pin-wrap {
          background: transparent;
          border: none;
        }
        .zz-custom-pin {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .zz-custom-pin:hover {
          transform: scale(1.08) translateY(-2px);
        }
        .zz-custom-pin.is-selected {
          transform: scale(1.15) translateY(-3px);
        }
        .zz-pin-seal {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #b83b2e;
          color: #ffffff;
          font-size: 11px;
          font-family: var(--font-serif, serif);
          font-weight: bold;
          box-shadow: 0 0 0 2px rgba(184, 59, 46, 0.3), 0 2px 5px rgba(0, 0, 0, 0.25);
        }
        .zz-custom-pin.is-selected .zz-pin-seal {
          background: #9b281c;
          box-shadow: 0 0 0 3px #d4a359, 0 3px 8px rgba(0, 0, 0, 0.35);
        }
        .zz-pin-badge {
          display: inline-block;
          background: #faf8f4;
          color: #2c241e;
          border: 1px solid #8e5431;
          padding: 2px 7px;
          font-size: 11px;
          font-family: var(--font-serif, serif);
          font-weight: 500;
          border-radius: 4px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
          letter-spacing: 0.04em;
        }
        .zz-custom-pin.is-selected .zz-pin-badge {
          background: #2c241e;
          color: #f7f3eb;
          border-color: #d4a359;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }
      `}</style>

      {/* 控制台与筛选栏 */}
      <div className="p-4 mb-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* 诸侯国筛选 */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-serif text-[var(--text-secondary)]">诸侯列国：</span>
              <div className="flex flex-wrap gap-1">
                {STATES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterState(st)}
                    className={`px-2.5 py-1 rounded text-xs font-serif transition-colors cursor-pointer ${
                      filterState === st
                        ? "bg-[var(--text-accent)] text-[var(--btn-accent-text,#ffffff)] font-medium"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* 行迹阶段筛选 */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-serif text-[var(--text-secondary)]">行迹阶段：</span>
              <div className="flex flex-wrap gap-1">
                {PERIODS.map((pd) => (
                  <button
                    key={pd}
                    type="button"
                    onClick={() => setFilterPeriod(pd)}
                    className={`px-2.5 py-1 rounded text-xs font-serif transition-colors cursor-pointer ${
                      filterPeriod === pd
                        ? "bg-[var(--color-accent-vermilion,#b83b2e)] text-[#ffffff] font-medium"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {pd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 重览全境 */}
          <button
            type="button"
            onClick={handleResetView}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--hover-bg)] text-xs font-serif text-[var(--text-primary)] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span className="seal-char" aria-hidden="true">覽</span>
            重览全境
          </button>
        </div>
      </div>

      {/* 双栏联动台：左侧/上方水墨舆图 + 右侧/下方风物考据卡 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 左侧舆图 */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm relative bg-[var(--bg-secondary)]">
          {/* 行迹图示角标 */}
          <div className="absolute top-3 left-3 z-[1000] px-3 py-1.5 rounded-lg bg-[var(--bg-card)]/90 backdrop-blur-sm border border-[var(--border-color)] shadow-sm text-xs font-serif text-[var(--text-primary)] flex items-center gap-2">
            <span className="inline-block w-4 h-0.5 border-b-2 border-dashed border-[#b83b2e]" />
            <span>庄子核心游历行迹（蒙 → 濮水 → 大梁 → 濠水 → 郢都）</span>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-[460px] sm:h-[540px] lg:h-[620px]"
          />
        </div>

        {/* 右侧：风物考据卡与地标名录 */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* 当前选中的考据主卡 */}
          {selectedLoc && (
            <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs transition-all">
              {/* 顶部标题与国印 */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-serif font-semibold bg-[var(--color-accent-vermilion,#b83b2e)]/10 text-[var(--color-accent-vermilion,#b83b2e)] border border-[var(--color-accent-vermilion,#b83b2e)]/30">
                      【{selectedLoc.state}】
                    </span>
                    <span className="text-xs font-serif text-[var(--text-muted)]">
                      {selectedLoc.year}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-serif text-[var(--text-primary)] tracking-wide">
                    {selectedLoc.name}
                  </h2>
                </div>
                {/* 篇目朱印 */}
                <div className="w-10 h-10 rounded border-2 border-[var(--color-accent-vermilion,#b83b2e)] text-[var(--color-accent-vermilion,#b83b2e)] font-serif font-bold text-xs flex items-center justify-center bg-[var(--bg-secondary)] shrink-0 shadow-inner">
                  {selectedLoc.chapter.slice(0, 2)}
                </div>
              </div>

              {/* 历史事件 */}
              <div className="text-xs font-serif text-[var(--text-accent)] font-medium mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-accent)]" />
                {selectedLoc.event}
              </div>

              {/* 考订详述 */}
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-serif mb-4">
                {selectedLoc.desc}
              </p>

              {/* 《庄子》原典引文框 */}
              <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] border-l-3 border-[var(--color-accent-vermilion,#b83b2e)] mb-4">
                <div className="text-[11px] font-serif text-[var(--text-muted)] mb-1">
                  《庄子 · {selectedLoc.chapter}》原典引录：
                </div>
                <blockquote className="text-xs sm:text-sm font-serif text-[var(--text-primary)] leading-relaxed italic">
                  “{selectedLoc.quote}”
                </blockquote>
              </div>

              {/* 直达原典链接 */}
              <div className="pt-2 border-t border-[var(--border-light)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)] font-serif">
                  经纬度：{selectedLoc.lat.toFixed(2)}°N, {selectedLoc.lng.toFixed(2)}°E
                </span>
                <Link
                  href={`/chapters/${selectedLoc.chapterId}`}
                  className="inline-flex items-center gap-1 text-xs font-serif font-semibold text-[var(--text-accent)] hover:text-[var(--color-accent-vermilion,#b83b2e)] hover:underline transition-colors"
                >
                  <span>展卷读原典</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          )}

          {/* 地标名录卡片列表 */}
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
            <div className="text-xs font-serif font-medium text-[var(--text-secondary)] mb-3 flex items-center justify-between">
              <span>诸侯行迹名录（{filteredLocations.length} 处）</span>
              <span className="text-[10px] text-[var(--text-muted)]">点击定轴巡览</span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {filteredLocations.map((loc) => {
                const isActive = loc.id === selectedId;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs font-serif transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "border-[var(--text-accent)] bg-[var(--text-accent)]/10 text-[var(--text-primary)] font-medium shadow-xs"
                        : "border-[var(--border-light)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive
                            ? "bg-[var(--color-accent-vermilion,#b83b2e)]"
                            : "bg-[var(--text-muted)]"
                        }`}
                      />
                      <span>{loc.name}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {loc.chapter}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
