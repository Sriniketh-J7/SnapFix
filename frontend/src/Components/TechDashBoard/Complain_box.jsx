import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TechnicianContext } from "../../contexts/TechnicianContext";
import { MapPin, ArrowRight, PlayCircle, CheckCircle, Loader, ThumbsUp, AlertTriangle } from "lucide-react";

const PRIORITY_LEFT = {
  Critical: "border-l-red-600",
  High:     "border-l-red-400",
  Medium:   "border-l-amber-400",
  Low:      "border-l-gray-200",
};
const PRIORITY_BADGE = {
  Critical: "bg-red-100 text-red-700 border border-red-200",
  High:     "bg-orange-50 text-orange-600 border border-orange-100",
  Medium:   "bg-amber-50 text-amber-500 border border-amber-100",
  Low:      "bg-gray-50 text-gray-400 border border-gray-100",
};
const STATUS_BADGE = {
  Assigned:     "bg-blue-50 text-blue-600 border border-blue-100",
  "In Progress":"bg-violet-50 text-violet-600 border border-violet-100",
  Resolved:     "bg-emerald-50 text-emerald-600 border border-emerald-100",
  Escalated:    "bg-red-100 text-red-700 border border-red-200",
};

export const ComplainBox = ({ _id: reportId, title, status, priority, priorityScore, location, upvotes, escalated, onUpdate }) => {
  const { startTask } = useContext(TechnicianContext);
  const [taskStatus, setTaskStatus] = useState(status);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (taskStatus !== "Assigned" && taskStatus !== "Escalated") return;
    setLoading(true);
    try {
      await startTask(reportId);
      setTaskStatus("In Progress");
      if (onUpdate) onUpdate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border-l-4 border border-gray-100 px-5 py-4 shadow-sm hover:shadow-md transition-all ${PRIORITY_LEFT[priority] || "border-l-gray-200"} ${escalated ? "ring-1 ring-red-400" : ""}`}>
      {/* Escalated banner */}
      {escalated && (
        <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold mb-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
          <AlertTriangle size={12} /> Escalated — unresolved over 14 hours
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-bold text-gray-900 capitalize text-sm leading-snug flex-1">{title}</p>
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[priority] || ""}`}>{priority}</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[taskStatus] || "bg-gray-50 text-gray-400"}`}>{taskStatus}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400 flex items-center gap-1 truncate flex-1">
          <MapPin size={11} className="shrink-0" /> {location?.address || "No location"}
        </p>
        {upvotes > 0 && (
          <span className="flex items-center gap-1 text-xs text-blue-500 font-semibold ml-2 shrink-0">
            <ThumbsUp size={11} /> {upvotes}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {(taskStatus === "Assigned" || taskStatus === "Escalated") && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white text-xs font-bold transition"
          >
            {loading ? <><Loader size={13} className="animate-spin" /> Starting…</> : <><PlayCircle size={13} /> Start Work</>}
          </button>
        )}
        {taskStatus === "In Progress" && (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-50 text-violet-600 text-xs font-bold border border-violet-100">
            <CheckCircle size={13} /> In Progress
          </div>
        )}
        {taskStatus === "Resolved" && (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
            <CheckCircle size={13} /> Resolved
          </div>
        )}
        <button
          onClick={() => navigate(`/report/${reportId}`)}
          className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
        >
          View <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
