"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import locations from "@/data/map-locations.json";

// Fix default marker icon paths (Leaflet webpack issue)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
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
      const marker = L.marker([loc.lat, loc.lng] as [number, number]).addTo(map);
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
