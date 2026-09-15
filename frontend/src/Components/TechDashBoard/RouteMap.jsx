import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getOptimizedRoute, updateTechLocation } from "../../apis/TechnicianApi";
import { Loader, Navigation, MapPin, AlertCircle } from "lucide-react";

const OSM_STYLE = {
  version: 8,
  sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors", maxzoom: 19 } },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const PRIORITY_COLOR = { Critical: "#DC2626", High: "#F59E0B", Medium: "#64748B", Low: "#94A3B8" };

export default function RouteMap() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState([]);
  const [techLocation, setTechLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get tech location, then load route
    if (!navigator.geolocation) {
      loadRoute(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await updateTechLocation(latitude, longitude);
        loadRoute({ latitude, longitude });
      },
      () => loadRoute(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const loadRoute = async (loc) => {
    const data = await getOptimizedRoute();
    if (!data) { setError("Could not load route."); setLoading(false); return; }

    const resolvedLoc = loc || (data.techLocation?.latitude ? data.techLocation : null);
    setTechLocation(resolvedLoc);
    setRoute(data.route || []);
    initMap(resolvedLoc, data.route || []);
  };

  const initMap = (loc, routeData) => {
    setTimeout(() => {
      if (!containerRef.current || mapRef.current) return;

      const center = loc
        ? [loc.longitude, loc.latitude]
        : routeData[0]?.location?.longitude
          ? [routeData[0].location.longitude, routeData[0].location.latitude]
          : [77.5946, 12.9716];

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center,
        zoom: 13,
        attributionControl: { compact: true },
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

      map.on("load", () => {
        setLoading(false);

        // Tech location marker (blue dot)
        if (loc) {
          const dot = document.createElement("div");
          dot.style.cssText = "width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);";
          new maplibregl.Marker({ element: dot }).setLngLat([loc.longitude, loc.latitude]).addTo(map);
        }

        if (!routeData.length) return;

        // Draw route line between stops
        const validStops = routeData.filter(r => r.location?.longitude && r.location?.latitude);

        if (validStops.length >= 2) {
          const coords = loc
            ? [[loc.longitude, loc.latitude], ...validStops.map(r => [r.location.longitude, r.location.latitude])]
            : validStops.map(r => [r.location.longitude, r.location.latitude]);

          map.addSource("route", {
            type: "geojson",
            data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } },
          });
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#3B82F6", "line-width": 3, "line-dasharray": [2, 2] },
          });
        }

        // Task markers with order number
        validStops.forEach((task, idx) => {
          const color = PRIORITY_COLOR[task.priority] || "#64748B";
          const el = document.createElement("div");
          el.style.cssText = `
            width:32px;height:32px;border-radius:50%;
            background:${color};color:white;
            font-weight:900;font-size:13px;
            display:flex;align-items:center;justify-content:center;
            border:2.5px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
            cursor:pointer;
          `;
          el.textContent = idx + 1;

          const popup = new maplibregl.Popup({ offset: 20, closeButton: false, maxWidth: "200px" })
            .setHTML(`
              <div style="font-family:system-ui;padding:2px 0;">
                <p style="font-size:11px;font-weight:700;color:#374151;margin:0 0 2px;">Stop ${idx + 1}</p>
                <p style="font-size:12px;font-weight:600;color:#111827;margin:0 0 3px;text-transform:capitalize;">${task.title}</p>
                <p style="font-size:11px;color:#6B7280;margin:0;">${task.status}</p>
                ${task._distFromPrev != null ? `<p style="font-size:10px;color:#9CA3AF;margin:3px 0 0;">${task._distFromPrev.toFixed(1)} km from prev</p>` : ""}
              </div>
            `);

          new maplibregl.Marker({ element: el })
            .setLngLat([task.location.longitude, task.location.latitude])
            .setPopup(popup)
            .addTo(map);
        });

        // Fit bounds to show all stops
        if (validStops.length) {
          const lngs = validStops.map(r => r.location.longitude);
          const lats = validStops.map(r => r.location.latitude);
          if (loc) { lngs.push(loc.longitude); lats.push(loc.latitude); }
          map.fitBounds(
            [[Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01], [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01]],
            { padding: 50, duration: 600 }
          );
        }
      });
    }, 80);

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div>
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Optimized</p>
        <h2 className="text-lg font-black text-gray-900">Task Route</h2>
        <p className="text-xs text-gray-400 mt-0.5">Nearest-neighbour order — tap pins to see details</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: 380 }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
            <Loader className="animate-spin text-blue-500" size={24} />
            <p className="text-sm text-gray-400">Building route…</p>
          </div>
        )}
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      </div>

      {/* Stop list */}
      {route.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stop Order</p>
          {route.map((task, idx) => (
            <div key={task._id} className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full text-white font-black text-xs flex items-center justify-center shrink-0"
                style={{ backgroundColor: PRIORITY_COLOR[task.priority] || "#64748B" }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm capitalize truncate">{task.title}</p>
                <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="shrink-0" />
                  {task.location?.address || "No address"}
                  {task._distFromPrev != null && (
                    <span className="ml-1 text-blue-400">{task._distFromPrev.toFixed(1)} km</span>
                  )}
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100 shrink-0">
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && route.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
          <Navigation className="mx-auto text-gray-200 mb-3" size={32} />
          <p className="text-gray-400 font-semibold text-sm">No active tasks to route</p>
        </div>
      )}
    </div>
  );
}
