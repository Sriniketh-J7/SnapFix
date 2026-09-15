import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DepartmentContext } from "../contexts/DepartmentContext";
import MiniMap from "../lib/MiniMap";
import { ArrowLeft, User, Loader, ThumbsUp } from "lucide-react";
import { formatDate } from "../lib/utils";

const STATUS_BADGE = {
  Pending:       "bg-amber-50 text-amber-600 border border-amber-100",
  Assigned:      "bg-blue-50 text-blue-600 border border-blue-100",
  "In Progress": "bg-violet-50 text-violet-600 border border-violet-100",
  Resolved:      "bg-emerald-50 text-emerald-600 border border-emerald-100",
  Escalated:     "bg-red-100 text-red-700 border border-red-200",
};
const PRIORITY_BADGE = {
  Critical: "bg-red-100 text-red-700 border border-red-200",
  High:     "bg-orange-50 text-orange-600 border border-orange-100",
  Medium:   "bg-amber-50 text-amber-500 border border-amber-100",
  Low:      "bg-gray-50 text-gray-400 border border-gray-100",
};

export const DeptReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSingleReport, getAllTechnicians, assignTechnician } = useContext(DepartmentContext);
  const [report, setReport] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState(null);

  useEffect(() => {
    Promise.all([getSingleReport(id), getAllTechnicians()]).then(([r, t]) => {
      setReport(r);
      setTechnicians(t || []);
      if (r?.assignedTechId?._id) setSelectedTech(r.assignedTechId._id);
    });
  }, [id]);

  const handleAssign = async () => {
    if (!selectedTech) return;
    setAssigning(true);
    const result = await assignTechnician(report._id, selectedTech);
    if (result?.success) {
      setAssignMsg("Technician assigned successfully.");
      setReport(prev => ({ ...prev, status: "Assigned", assignedTechId: technicians.find(t => t._id === selectedTech) }));
    } else {
      setAssignMsg("Failed to assign.");
    }
    setAssigning(false);
  };

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
      <Loader className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate("/DeptReports")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Report</p>
          <h1 className="font-black text-gray-900 text-base leading-tight">Detail</h1>
        </div>
        <span className="ml-auto text-xs text-gray-400 font-mono">{report.reportId}</span>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <h2 className="text-lg font-black text-gray-900 capitalize">{report.title}</h2>
              <div className="flex gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_BADGE[report.status] || "bg-gray-50 text-gray-500"}`}>
                  {report.status}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${PRIORITY_BADGE[report.priority] || "bg-gray-50 text-gray-400"}`}>
                  {report.priority}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
              <span>Reported: {formatDate(report.createdAt)}</span>
              {report.upvotes > 0 && (
                <span className="flex items-center gap-1 text-blue-500 font-semibold">
                  <ThumbsUp size={11} /> {report.upvotes} upvotes
                </span>
              )}
              <span>Score: {report.priorityScore || 0}/100</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{report.location?.address}</p>
          </div>

          {/* Citizen */}
          {report.userId && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User size={13} /> Citizen
              </p>
              <p className="text-sm text-gray-700 font-semibold">{report.userId.userName}</p>
            </div>
          )}

          {/* Photo */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Report Photo</p>
            {report.imageUrl
              ? <img src={report.imageUrl} alt="Report" className="w-full max-h-64 object-cover rounded-xl" />
              : <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">No photo</div>
            }
          </div>

          {report.description && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Assign */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Assign Technician</p>
            {assignMsg && (
              <p className={`text-xs mb-3 px-3 py-2 rounded-xl border ${
                assignMsg.includes("success")
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-red-50 text-red-600 border-red-100"
              }`}>{assignMsg}</p>
            )}
            <select value={selectedTech} onChange={e => setSelectedTech(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50">
              <option value="">Select Technician</option>
              {technicians.map(t => (
                <option key={t._id} value={t._id}>{t.userName} — {t.status}</option>
              ))}
            </select>
            <button onClick={handleAssign} disabled={assigning || !selectedTech}
              className="mt-3 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white text-sm font-bold rounded-xl transition">
              {assigning ? "Assigning…" : "Assign"}
            </button>
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Location</p>
            <MiniMap latitude={report.location?.latitude} longitude={report.location?.longitude} label={report.location?.address} />
          </div>

          {/* Resolution photo */}
          {report.resolvedImageUrl && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">Resolution Photo</p>
              <img src={report.resolvedImageUrl} alt="Resolution" className="w-full rounded-xl object-cover max-h-48" />
              {report.resolvedTime && (
                <p className="text-xs text-gray-400 mt-2">Resolved: {formatDate(report.resolvedTime)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
