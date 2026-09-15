import { useEffect, useRef, useState, useContext, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader, MapPin, AlertCircle, Layers, ThumbsUp, X, Filter, Map } from "lucide-react";
import { UserContext } from "../contexts/UserContext";
import { cityReports, heatmapData, upvoteReport } from "../apis/UserApi";
import { formatDate } from "../lib/utils";

// ── Constants ────────────────────────────────────────────────
const CATEGORY_STYLE = {
  "water leakage":            { color: "#3B82F6", label: "Water" },
  "broken water pipe":        { color: "#3B82F6", label: "Water" },
  "street light not working": { color: "#F59E0B", label: "Electrical" },
  "broken traffic signal":    { color: "#F59E0B", label: "Electrical" },
  "power outage":             { color: "#F59E0B", label: "Electrical" },
  "road damage":              { color: "#64748B", label: "Civil" },
  "pothole":                  { color: "#64748B", label: "Civil" },
  "damaged footpath":         { color: "#64748B", label: "Civil" },
  "garbage not collected":    { color: "#10B981", label: "Sanitation" },
  "blocked drain":            { color: "#10B981", label: "Sanitation" },
  "stray animals":            { color: "#8B5CF6", label: "Animal" },
  "animal attack":            { color: "#EF4444", label: "Animal" },
};
const PRIORITY_COLOR = { Critical: "#DC2626", High: "#F59E0B", Medium: "#64748B", Low: "#94A3B8" };
const LEGEND = [
  { color: "#3B82F6", label: "Water" },
  { color: "#F59E0B", label: "Electrical" },
  { color: "#64748B", label: "Civil" },
  { color: "#10B981", label: "Sanitation" },
  { color: "#8B5CF6", label: "Animal" },
  { color: "#EF4444", label: "High Danger" },
];
const OSM_STYLE = {
  version: 8,
  sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors", maxzoom: 19 } },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

function getStyle(title) {
  const key = Object.keys(CATEGORY_STYLE).find(k => k === title?.toLowerCase().trim());
  return CATEGORY_STYLE[key] || { color: "#6B7280", label: "Other" };
}

// ── Heatmap gradient colours ─────────────────────────────────
function weightToColor(weight) {
  // weight 0-100: blue → yellow → red
  if (weight > 75) return "rgba(220,38,38,0.55)";
  if (weight > 50) return "rgba(245,158,11,0.5)";
  if (weight > 25) return "rgba(59,130,246,0.45)";
  return "rgba(16,185,129,0.35)";
}

// ── Report detail side panel ─────────────────────────────────
function ReportPanel({ report, onClose, onUpvote, userId }) {
  const [voting, setVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState(report.upvotes || 0);
  const [voted, setVoted] = useState(report.upvotedBy?.some(id => id === userId));

  const handleUpvote = async () => {
    if (!userId) return;
    setVoting(true);
    try {
      const result = await upvoteReport(report._id);
      if (result?.success) {
        setLocalVotes(result.upvotes);
        setVoted(result.voted);
        onUpvote(report._id, result.upvotes, result.priority);
      }
    } finally { setVoting(false); }
  };

  const pColor = PRIORITY_COLOR[report.priority] || "#64748B";
  const { label } = getStyle(report.title);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 animate-slide-up">
      <div className="bg-white rounded-t-3xl shadow-2xl p-5 max-h-[60vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: pColor }}>
                {report.priority}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">{label}</span>
            </div>
            <p className="font-black text-gray-900 text-base capitalize leading-tight">{report.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <MapPin size={10} className="shrink-0" /> {report.location?.address || "No address"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition shrink-0">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {report.imageUrl && (
          <img src={report.imageUrl} alt="Report" className="w-full h-40 object-cover rounded-xl mb-4" />
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Status", value: report.status },
            { label: "Department", value: report.deptName },
            { label: "Reported", value: formatDate(report.createdAt) },
          ].map(f => (
            <div key={f.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{f.label}</p>
              <p className="text-xs font-bold text-gray-700 mt-0.5 leading-tight">{f.value}</p>
            </div>
          ))}
        </div>

        {/* Upvote button */}
        <button
          onClick={handleUpvote}
          disabled={voting || !userId}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition ${
            voted
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
          } disabled:opacity-50`}
        >
          {voting ? <Loader size={15} className="animate-spin" /> : <ThumbsUp size={15} />}
          {voted ? "Upvoted" : "Upvote"} · {localVotes}
          {!userId && <span className="text-xs opacity-70 ml-1">(login to vote)</span>}
        </button>

        {report.upvotes > 5 && (
          <p className="text-center text-xs text-amber-600 mt-2 font-medium">
            High community concern — priority boosted
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Explore page ────────────────────────────────────────
const Explore = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const heatCirclesRef = useRef([]);

  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewMode, setViewMode] = useState("pins"); // "pins" | "heatmap"
  const [radius, setRadius] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDept, setFilterDept] = useState("All");

  const { userData } = useContext(UserContext);

  // Load city reports
  const loadReports = useCallback(async (lat, lng) => {
    const data = await cityReports(lat, lng, radius);
    setReports(data);
    return data;
  }, [radius]);

  // Place markers on map
  const placeMarkers = useCallback((map, reportsToPin) => {
    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = filterDept === "All"
      ? reportsToPin
      : reportsToPin.filter(r => {
          const { label } = getStyle(r.title);
          return label === filterDept;
        });

    filtered.forEach((report) => {
      if (!report.location?.latitude || !report.location?.longitude) return;
      const { color } = getStyle(report.title);

      // Pin size based on upvotes + priority
      const size = Math.min(28 + (report.upvotes || 0) * 2, 44);
      const el = document.createElement("div");
      el.style.cssText = `cursor:pointer;width:${size}px;height:${Math.round(size * 1.3)}px;`;

      // Escalated reports pulse
      if (report.escalated) {
        el.style.animation = "pulse 1.5s infinite";
      }

      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size*1.3)}" viewBox="0 0 28 36">
        <circle cx="14" cy="14" r="12" fill="${color}" stroke="white" stroke-width="2.5" opacity="${report.status === 'Escalated' ? '1' : '0.9'}"/>
        ${report.upvotes > 0 ? `<text x="14" y="18" text-anchor="middle" font-size="9" font-weight="bold" fill="white">${report.upvotes > 99 ? '99+' : report.upvotes}</text>` : ''}
        <line x1="14" y1="26" x2="14" y2="34" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      </svg>`;

      el.addEventListener("click", () => setSelectedReport(report));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.location.longitude, report.location.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filterDept]);

  // Draw heatmap circles
  const drawHeatmap = useCallback(async (map) => {
    // Remove old circles
    heatCirclesRef.current.forEach(c => c.remove());
    heatCirclesRef.current = [];

    const points = await heatmapData();
    points.forEach(p => {
      const el = document.createElement("div");
      const size = Math.min(30 + (p.weight / 100) * 60, 90);
      el.style.cssText = `
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:${weightToColor(p.weight)};
        pointer-events:none;
        transform:translate(-50%,-50%);
      `;
      const m = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      heatCirclesRef.current.push(m);
    });
  }, []);

  // Init map
  const initMap = useCallback((center, lat, lng) => {
    setTimeout(async () => {
      if (!mapContainer.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: OSM_STYLE,
        center,
        zoom: 13,
        attributionControl: { compact: true },
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

      // User dot
      const dot = document.createElement("div");
      dot.style.cssText = "width:14px;height:14px;border-radius:50%;background:#3B82F6;border:2.5px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.25);pointer-events:none;";
      new maplibregl.Marker({ element: dot }).setLngLat(center).addTo(map);

      map.on("load", async () => {
        setLoading(false);
        const data = await loadReports(lat, lng);
        placeMarkers(map, data);
      });

      // Close panel on map click
      map.on("click", () => setSelectedReport(null));
    }, 80);
  }, [loadReports, placeMarkers]);

  useEffect(() => {
    if (!navigator.geolocation) {
      initMap([77.5946, 12.9716], null, null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos({ lat, lng });
        initMap([lng, lat], lat, lng);
      },
      () => {
        setLocError("Location denied — showing all city reports.");
        initMap([77.5946, 12.9716], null, null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // Re-place markers when filter or viewMode changes
  useEffect(() => {
    if (!mapRef.current || !reports.length) return;
    const map = mapRef.current;
    if (viewMode === "heatmap") {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      drawHeatmap(map);
    } else {
      heatCirclesRef.current.forEach(c => c.remove());
      heatCirclesRef.current = [];
      placeMarkers(map, reports);
    }
  }, [viewMode, filterDept, reports]);

  const handleUpvoteUpdate = (reportId, newVotes, newPriority) => {
    setReports(prev => prev.map(r =>
      r._id === reportId ? { ...r, upvotes: newVotes, priority: newPriority } : r
    ));
    if (selectedReport?._id === reportId) {
      setSelectedReport(prev => ({ ...prev, upvotes: newVotes, priority: newPriority }));
    }
  };

  const DEPTS = ["All", "Water", "Electrical", "Civil", "Sanitation", "Animal"];

  return (
    <div className="relative h-screen bg-[#f8f9fc] font-sans overflow-hidden" style={{ paddingBottom: 72 }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex gap-2">
        <div className="flex-1 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100 flex items-center gap-2">
          <Map size={14} className="text-blue-500 shrink-0" />
          <p className="text-sm font-bold text-gray-800">City Issues</p>
          <span className="ml-auto text-xs text-gray-400 font-medium">{reports.length} active</span>
        </div>
        <button
          onClick={() => setShowFilters(p => !p)}
          className={`w-11 h-11 flex items-center justify-center rounded-2xl shadow-sm border transition ${showFilters ? "bg-blue-600 border-blue-600 text-white" : "bg-white/90 border-gray-100 text-gray-600 backdrop-blur-md"}`}
        >
          <Filter size={16} />
        </button>
        <button
          onClick={() => setViewMode(m => m === "pins" ? "heatmap" : "pins")}
          className={`w-11 h-11 flex items-center justify-center rounded-2xl shadow-sm border transition ${viewMode === "heatmap" ? "bg-orange-500 border-orange-500 text-white" : "bg-white/90 border-gray-100 text-gray-600 backdrop-blur-md"}`}
          title={viewMode === "heatmap" ? "Switch to pins" : "Show heatmap"}
        >
          <Layers size={16} />
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-4 space-y-3 animate-fade-in">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Department</p>
            <div className="flex flex-wrap gap-2">
              {DEPTS.map(d => (
                <button key={d} onClick={() => setFilterDept(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${filterDept === d ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Radius: {radius} km</p>
            <input type="range" min={1} max={50} value={radius} onChange={e => setRadius(Number(e.target.value))}
              className="w-full accent-blue-600" />
          </div>
          <button
            onClick={async () => {
              setShowFilters(false);
              const data = await loadReports(userPos?.lat, userPos?.lng);
              if (mapRef.current) placeMarkers(mapRef.current, data);
            }}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm"
          >
            Apply
          </button>
        </div>
      )}

      {/* Map */}
      <div className="absolute inset-0" style={{ top: 0, bottom: 72 }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
            <Loader className="animate-spin text-blue-500" size={26} />
            <p className="text-sm text-gray-400 font-medium">Loading city issues…</p>
          </div>
        )}
        {locError && !loading && (
          <div className="absolute top-20 left-4 right-4 z-10 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-2.5 rounded-xl">
            <AlertCircle size={13} className="shrink-0" /> {locError}
          </div>
        )}
        <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />
      </div>

      {/* Legend - bottom left above footer */}
      {viewMode === "pins" && !selectedReport && (
        <div className="absolute bottom-20 left-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2.5 shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {LEGEND.map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="text-[10px] font-medium text-gray-600">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {viewMode === "heatmap" && !selectedReport && (
        <div className="absolute bottom-20 left-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2.5 shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Density</p>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "rgba(16,185,129,0.55)" }} />
              <span className="text-[10px] text-gray-500">Low</span>
              <span className="w-3 h-3 rounded-full" style={{ background: "rgba(245,158,11,0.6)" }} />
              <span className="text-[10px] text-gray-500">Med</span>
              <span className="w-3 h-3 rounded-full" style={{ background: "rgba(220,38,38,0.7)" }} />
              <span className="text-[10px] text-gray-500">High</span>
            </div>
          </div>
        </div>
      )}

      {/* Report detail panel */}
      {selectedReport && (
        <div className="absolute bottom-[72px] left-0 right-0 z-20">
          <ReportPanel
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onUpvote={handleUpvoteUpdate}
            userId={userData?._id}
          />
        </div>
      )}
    </div>
  );
};

export default Explore;
