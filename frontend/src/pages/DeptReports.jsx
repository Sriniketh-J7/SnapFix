import { useContext, useEffect, useState } from "react";
import { DepartmentContext } from "../contexts/DepartmentContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Loader, Search, MapPin } from "lucide-react";
import { formatDate } from "../lib/utils";

const STATUS_STYLE = {
  Pending:       { pill: "bg-amber-50 text-amber-600 border border-amber-100",    dot: "bg-amber-400" },
  Assigned:      { pill: "bg-blue-50 text-blue-600 border border-blue-100",       dot: "bg-blue-400" },
  "In Progress": { pill: "bg-violet-50 text-violet-600 border border-violet-100", dot: "bg-violet-400" },
  Resolved:      { pill: "bg-emerald-50 text-emerald-600 border border-emerald-100", dot: "bg-emerald-400" },
};
const PRIORITY_STYLE = {
  High:   "bg-red-50 text-red-500 border border-red-100",
  Medium: "bg-amber-50 text-amber-500 border border-amber-100",
  Low:    "bg-gray-50 text-gray-400 border border-gray-100",
};

export const DeptReports = () => {
  const { getAllReports } = useContext(DepartmentContext);
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const load = async () => { setFetching(true); const d = await getAllReports(); setReports(d || []); setFetching(false); };
  useEffect(() => { load(); }, []);

  const counts = { All: reports.length, Pending: 0, Assigned: 0, "In Progress": 0, Resolved: 0 };
  reports.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  const filtered = reports
    .filter(r => activeTab === "All" || r.status === activeTab)
    .filter(r => !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.reportId?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/DeptOverview")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
            <div>
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Department</p>
              <h1 className="font-black text-gray-900 text-base">All Reports</h1>
            </div>
          </div>
          <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
            <RefreshCw size={16} className="text-gray-400" />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-5 space-y-4">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus-within:border-indigo-300 transition">
          <Search size={15} className="text-gray-300 shrink-0" />
          <input type="text" placeholder="Search title or ID…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-gray-800 bg-transparent placeholder:text-gray-300" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {["All","Pending","Assigned","In Progress","Resolved"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                activeTab === tab ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {tab} <span className="opacity-60">({counts[tab] ?? 0})</span>
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-indigo-400" size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 font-semibold text-sm">No reports found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const ss = STATUS_STYLE[r.status] || STATUS_STYLE.Pending;
              return (
                <div key={r._id} onClick={() => navigate(`/dept/report/${r._id}`)}
                  className="bg-white rounded-2xl px-5 py-4 border border-gray-100 hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 capitalize truncate text-sm group-hover:text-indigo-600 transition">{r.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.reportId} · {formatDate(r.createdAt)}</p>
                      {r.location?.address && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0" />{r.location.address}</p>
                      )}
                      {r.assignedTechId && <p className="text-xs text-indigo-400 mt-1 font-medium">{r.assignedTechId.userName}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5 items-end shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${ss.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />{r.status}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${PRIORITY_STYLE[r.priority] || ""}`}>{r.priority}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
