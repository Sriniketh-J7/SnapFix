import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Free tile style - OpenStreetMap via maptiler (no API key needed for this style)
const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export default function MiniMap({ latitude, longitude, label }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;
    // Destroy old instance if coords change
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Small delay ensures container has rendered dimensions
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [longitude, latitude],
        zoom: 15,
        interactive: false,
        attributionControl: { compact: true },
      });

      mapRef.current = map;

      map.on("load", () => {
        new maplibregl.Marker({ color: "#3B82F6" })
          .setLngLat([longitude, latitude])
          .addTo(map);
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  if (!latitude || !longitude) {
    return (
      <div className="h-44 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
        No location data
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-gray-100"
      style={{ height: 192 }}
    />
  );
}
