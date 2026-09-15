import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TechnicianContext } from "../contexts/TechnicianContext";
import { formatDate } from "../lib/utils";
import CameraCapture from "../lib/Camera";
import MiniMap from "../lib/MiniMap";
import { ArrowLeft, AlertTriangle, Clock, CheckCircle, Loader } from "lucide-react";

const PRIORITY_COLORS = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High:     "bg-orange-100 text-orange-700 border-orange-200",
  Medium:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low:      "bg-gray-100 text-gray-600 border-gray-200",
};
const STATUS_COLORS = {
  Pending:      "bg-orange-100 text-orange-700 border-orange-200",
  Assigned:     "bg-blue-100 text-blue-700 border-blue-200",
  "In Progress":"bg-yellow-100 text-yellow-700 border-yellow-200",
  Resolved:     "bg-green-100 text-green-700 border-green-200",
  Escalated:    "bg-red-100 text-red-700 border-red-200",
};

export const ReportDetail = () => {
  const { loading, getSingleTask, startTask } = useContext(TechnicianContext);
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [starting, setStarting] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    getSingleTask(reportId).then(data => {
      if (data) setReport(data);
      else setFetchError("Could not load task.");
    });
  }, [reportId]);

  const handleStart = async () => {
    if (!report || (report.status !== "Assigned" && report.status !== "Escalated")) return;
    setStarting(true);
    const updated = await startTask(report._id);
    if (updated) setReport(updated);
    setStarting(false);
  };

  if (loading && !report) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
      <Loader className="animate-spin text-blue-500" size={36} />
    </div>
  );

  if (fetchError || !report) return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-8">
      <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <AlertTriangle className="mx-auto text-red-400 mb-3" size={36} />
        <h1 className="text-xl font-black text-gray-800">Task Not Found</h1>
        <p className="text-gray-400 mt-1 text-sm">{fetchError}</p>
        <button onClick={() => navigate("/TechDashboard")}
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-gray-100">
        <button onClick={() => navigate("/TechDashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft size={18} />
          <span className="text-sm font-semibold">Back</span>
        </button>
        <h1 className="text-base font-black text-gray-900">Task Detail</h1>
        <span className="text-xs text-slate-400 font-mono">{report.reportId || "—"}</span>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4">
          {/* Escalated banner */}
          {report.escalated && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-3 rounded-xl">
              <AlertTriangle size={13} /> Escalated — unresolved for 14+ hours
            </div>
          )}

          {/* Title + badges */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-black text-gray-900 capitalize">{report.title}</h2>
              <div className="flex gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${STATUS_COLORS[report.status] || "bg-gray-100 text-gray-600"}`}>
                  {report.status}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${PRIORITY_COLORS[report.priority] || "bg-gray-100 text-gray-600"}`}>
                  {report.priority}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Clock size={11} /> {formatDate(report.createdAt)}
            </p>
          </div>

          {/* Report Photo */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Report Photo</p>
            {report.imageUrl
              ? <img src={report.imageUrl} alt="Report" className="w-full max-h-64 object-cover rounded-xl" />
              : <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">No photo</div>
            }
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm text-gray-600 leading-relaxed">{report.description || "No description provided."}</p>
          </div>

          {/* Resolution */}
          {report.status === "Resolved" ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <p className="font-bold text-emerald-800 flex items-center gap-2 text-sm">
                <CheckCircle size={16} /> Resolved
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-emerald-600 font-bold mb-0.5">Started</p>
                  <p className="text-gray-700">{report.startedAt ? formatDate(report.startedAt) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-emerald-600 font-bold mb-0.5">Resolved</p>
                  <p className="text-gray-700">{report.resolvedTime ? formatDate(report.resolvedTime) : "—"}</p>
                </div>
              </div>
              {report.resolvedImageUrl && (
                <img src={report.resolvedImageUrl} alt="Resolution" className="w-full max-h-56 object-cover rounded-xl" />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Upload Resolution Photo</p>
              <CameraCapture reportId={reportId} onResolved={(updated) => setReport(updated)} />
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Start task */}
          {(report.status === "Assigned" || report.status === "Escalated") && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Actions</p>
              <button onClick={handleStart} disabled={starting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm">
                {starting ? <><Loader size={15} className="animate-spin" /> Starting…</> : "Start Work"}
              </button>
            </div>
          )}

          {/* Map */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Location</p>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">{report.location?.address || "No address"}</p>
            <MiniMap latitude={report.location?.latitude} longitude={report.location?.longitude} label={report.location?.address} />
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Timeline</p>
            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              <li className="ml-4 relative">
                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
                <p className="text-xs font-bold text-gray-700">Reported</p>
                <p className="text-xs text-gray-400">{formatDate(report.createdAt)}</p>
              </li>
              {report.startedAt && (
                <li className="ml-4 relative">
                  <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-violet-400 border-2 border-white" />
                  <p className="text-xs font-bold text-gray-700">Work Started</p>
                  <p className="text-xs text-gray-400">{formatDate(report.startedAt)}</p>
                </li>
              )}
              {report.resolvedTime && (
                <li className="ml-4 relative">
                  <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  <p className="text-xs font-bold text-emerald-700">Resolved</p>
                  <p className="text-xs text-gray-400">{formatDate(report.resolvedTime)}</p>
                </li>
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
