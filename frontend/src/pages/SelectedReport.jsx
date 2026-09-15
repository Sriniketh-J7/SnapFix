import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDate } from "../lib/utils";
import { UserContext } from "../contexts/UserContext";
import MiniMap from "../lib/MiniMap";
import { ArrowLeft, Clock, MapPin, Tag, CheckCircle, Loader, ThumbsUp, AlertTriangle } from "lucide-react";
import { upvoteReport } from "../apis/UserApi";

const STATUS_STYLE = {
  Pending:       { pill: "bg-amber-50 text-amber-600 border border-amber-100" },
  Assigned:      { pill: "bg-blue-50 text-blue-600 border border-blue-100" },
  "In Progress": { pill: "bg-violet-50 text-violet-600 border border-violet-100" },
  Resolved:      { pill: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  Escalated:     { pill: "bg-red-100 text-red-700 border border-red-200" },
};
const PRIORITY_STYLE = {
  Critical: "bg-red-100 text-red-700 border border-red-200",
  High:     "bg-orange-50 text-orange-600 border border-orange-100",
  Medium:   "bg-amber-50 text-amber-500 border border-amber-100",
  Low:      "bg-gray-50 text-gray-400 border border-gray-100",
};

export const SelectedReport = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const { singleReport, loading, submitFeedback, userData } = useContext(UserContext);
  const [report, setReport] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    singleReport(reportId).then(data => {
      if (data) {
        setReport(data);
        setUpvotes(data.upvotes || 0);
        setVoted(data.upvotedBy?.some(id => id === userData?._id?.toString()));
      }
    });
  }, [reportId]);

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitting(true);
    const result = await submitFeedback(reportId, feedback);
    if (result?.success) setFeedbackSent(true);
    setSubmitting(false);
  };

  const handleUpvote = async () => {
    if (!userData) return;
    setVoting(true);
    try {
      const result = await upvoteReport(reportId);
      if (result?.success !== false) {
        setUpvotes(result.upvotes);
        setVoted(result.voted);
        setReport(prev => ({ ...prev, upvotes: result.upvotes, priority: result.priority }));
      }
    } finally { setVoting(false); }
  };

  if (loading && !report) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
      <Loader className="animate-spin text-blue-500" size={32} />
    </div>
  );

  if (!report) return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
        <h1 className="text-xl font-black text-gray-800">Report Not Found</h1>
        <button onClick={() => navigate("/userReportsPage")} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Back</button>
      </div>
    </div>
  );

  const ss = STATUS_STYLE[report.status] || STATUS_STYLE.Pending;

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-28 font-sans">
      <header className="bg-white shadow-sm px-5 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-gray-100">
        <button onClick={() => navigate("/userReportsPage")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft size={18} />
          <span className="text-sm font-semibold">My Reports</span>
        </button>
        <span className="text-xs text-slate-400 font-mono">{report.reportId}</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Status + escalation */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          {report.escalated && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs font-bold px-3 py-2 rounded-xl border border-red-100 mb-3">
              <AlertTriangle size={13} /> This report has been escalated — unresolved over 14 hours
            </div>
          )}
          <div className="flex flex-wrap justify-between items-start gap-3">
            <h2 className="text-xl font-black text-gray-900 capitalize">{report.title}</h2>
            <div className="flex gap-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${ss.pill}`}>{report.status}</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${PRIORITY_STYLE[report.priority] || ""}`}>{report.priority}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock size={11} />{formatDate(report.createdAt)}</span>
            <span className="flex items-center gap-1"><Tag size={11} />{report.reportId}</span>
            {report.location?.address && <span className="flex items-center gap-1"><MapPin size={11} className="shrink-0" />{report.location.address}</span>}
          </div>

          {/* Upvote */}
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">Community Priority Score</p>
              <p className="text-xs text-gray-400 mt-0.5">{upvotes} upvote{upvotes !== 1 ? "s" : ""} · Score {report.priorityScore || 0}/100</p>
            </div>
            <button
              onClick={handleUpvote}
              disabled={voting || !userData}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                voted ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
              } disabled:opacity-50`}
            >
              {voting ? <Loader size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
              {voted ? "Upvoted" : "Upvote"} · {upvotes}
            </button>
          </div>
        </div>

        {/* Photo */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Report Photo</p>
          {report.imageUrl
            ? <img src={report.imageUrl} alt="Report" className="w-full max-h-64 object-cover rounded-xl" />
            : <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">No photo</div>
          }
        </div>

        {/* Description */}
        {report.description && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>
          </div>
        )}

        {/* Assigned technician */}
        {report.assignedTechId && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Assigned Technician</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                {report.assignedTechId.userName?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{report.assignedTechId.userName}</p>
                {report.assignedTechId.email && <p className="text-xs text-gray-400">{report.assignedTechId.email}</p>}
              </div>
              <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-bold border ${
                report.assignedTechId.status === "Available" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
              }`}>{report.assignedTechId.status}</span>
            </div>
          </div>
        )}

        {/* Map + Resolution grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Location</p>
            <MiniMap latitude={report.location?.latitude} longitude={report.location?.longitude} label={report.location?.address} />
          </div>

          {report.status === "Resolved" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-3">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle size={13} /> Resolved</p>
              {report.startedAt && <p className="text-xs text-gray-600">Started: <span className="font-semibold">{formatDate(report.startedAt)}</span></p>}
              {report.resolvedTime && <p className="text-xs text-gray-600">Resolved: <span className="font-semibold">{formatDate(report.resolvedTime)}</span></p>}
              {report.resolvedImageUrl && <img src={report.resolvedImageUrl} alt="Resolution" className="w-full h-36 object-cover rounded-xl" />}
            </div>
          )}
        </div>

        {/* Feedback */}
        {report.status === "Resolved" && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Leave Feedback</p>
            {feedbackSent || report.feedback ? (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                <CheckCircle size={15} /> {report.feedback || "Feedback submitted."}
              </div>
            ) : (
              <form onSubmit={handleFeedback} className="space-y-3">
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                  className="w-full h-24 p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-gray-50"
                  placeholder="How was the resolution?" />
                <button type="submit" disabled={submitting || !feedback.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white text-sm font-bold rounded-xl transition flex items-center gap-2">
                  {submitting ? <><Loader size={13} className="animate-spin" /> Submitting…</> : "Submit Feedback"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
