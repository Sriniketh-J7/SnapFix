import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { formatDate } from "../lib/utils";
import { Plus, Search, Loader, AlertCircle, MapPin } from "lucide-react";

const STATUS_STYLE = {
  Pending:      { pill: "bg-amber-50 text-amber-600 border border-amber-100",   dot: "bg-amber-400" },
  Assigned:     { pill: "bg-blue-50 text-blue-600 border border-blue-100",      dot: "bg-blue-400" },
  "In Progress":{ pill: "bg-violet-50 text-violet-600 border border-violet-100",dot: "bg-violet-400" },
  Resolved:     { pill: "bg-emerald-50 text-emerald-600 border border-emerald-100", dot: "bg-emerald-400" },
};
const PRIORITY_STYLE = {
  High:   "bg-red-50 text-red-500 border border-red-100",
  Medium: "bg-amber-50 text-amber-500 border border-amber-100",
  Low:    "bg-gray-50 text-gray-400 border border-gray-100",
};

export const UserReportsPage = () => {
  const navigate = useNavigate();
  const { myReports } = useContext(UserContext);
  const [reports, setReports] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    myReports().then(data => { setReports(data || []); setFetching(false); });
  }, []);

  const counts = { All: reports.length, Pending: 0, "In Progress": 0, Resolved: 0 };
  reports.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  const filtered = reports
    .filter(r => filter === "All" || r.status === filter)
    .filter(r => !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.reportId?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-28 font-sans">
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-0.5">History</p>
            <h1 className="text-xl font-black text-gray-900">My Reports</h1>
          </div>
          <button onClick={() => navigate("/reportIssue")}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm shadow-blue-100">
            <Plus size={15} /> New
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus-within:border-blue-300 transition">
          <Search size={15} className="text-gray-300 shrink-0" />
          <input type="text" placeholder="Search title or ID…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-gray-800 bg-transparent placeholder:text-gray-300" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {["All", "Pending", "In Progress", "Resolved"].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                filter === tab
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {tab} <span className="opacity-60">({counts[tab] ?? 0})</span>
            </button>
          ))}
        </div>

        {/* List */}
        {fetching ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-400" size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <AlertCircle className="mx-auto text-gray-200 mb-3" size={36} />
            <p className="text-gray-500 font-semibold text-sm">No reports found</p>
            <p className="text-xs text-gray-400 mt-1">Adjust the filter or submit a new report</p>
            <button onClick={() => navigate("/reportIssue")} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">Report an Issue</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const ss = STATUS_STYLE[r.status] || STATUS_STYLE.Pending;
              return (
                <div key={r._id} onClick={() => navigate(`/singlereport/${r._id}`)}
                  className="bg-white rounded-2xl px-5 py-4 border border-gray-100 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 capitalize truncate text-sm group-hover:text-blue-600 transition">{r.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.reportId} · {formatDate(r.createdAt)}</p>
                      {r.location?.address && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 truncate">
                          <MapPin size={10} className="shrink-0" /> {r.location.address}
                        </p>
                      )}
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
