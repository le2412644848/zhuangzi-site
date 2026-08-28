"use client";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";

import locations from "@/data/map-locations.json";

// 自绘「印章」圆点标记（2026-08-24 视觉复审）：默认蓝色大头针与全站
// 水墨赭石语言冲突，改用主题变量着色的圆点印章（样式见 globals.css 的 .zz-pin）。
const sealIcon = L.divIcon({
  className: "zz-pin-wrap",
  html: '<span class="zz-pin"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

export default function ZhuangziMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([34.5, 114], 6);

    // 高德地图瓦片（国内源，速度快）
    L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", {
      subdomains: ["1", "2", "3", "4"],
      attribution: "© 高德地图",
      maxZoom: 18,
    }).addTo(map);

    locations.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng] as [number, number], {
        icon: sealIcon,
        title: loc.name,
      }).addTo(map);
      marker.bindPopup(`<b>${loc.name}</b><br>${loc.desc}<br><i>${loc.event}</i>`);
    });

    mapInstanceRef.current = map;

    // Fix tiles not rendering on initial load
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-[500px] rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)]"
    />
  );
}
