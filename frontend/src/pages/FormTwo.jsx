import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { CheckCircle, Loader, ArrowLeft, AlertTriangle } from "lucide-react";

export const FormTwo = () => {
  const { newReport, createReport } = useContext(UserContext);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Guard - if somehow user lands here without data, send back
  if (!newReport?.title || !newReport?.imageUrl || !newReport?.location) {
    navigate("/reportIssue");
    return null;
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await createReport();
      if (data?.report) setResult(data.report);
      else setError("Failed to submit. Please try again.");
    } catch (err) {
      setError(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ── */
  if (result) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="text-emerald-500" size={36} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Report Submitted</h2>
            <p className="text-sm text-gray-400 mt-1">
              Your report is now live and being processed.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2.5 border border-gray-100">
            {[
              { label: "Report ID",   value: result.reportId,             mono: true  },
              { label: "Department",  value: result.deptName                           },
              { label: "Priority",    value: result.priority,             color: result.priority === "High" ? "text-red-600" : result.priority === "Medium" ? "text-amber-600" : "text-gray-500" },
              { label: "Status",      value: result.status,               color: "text-blue-600" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">{row.label}</span>
                <span className={`font-bold ${row.color || "text-gray-800"} ${row.mono ? "font-mono" : ""}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            You will receive real-time notifications as your report progresses.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/userReportsPage")}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm"
            >
              View My Reports
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-sm"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Review screen ── */
  const imagePreview =
    typeof newReport.imageUrl === "string"
      ? newReport.imageUrl
      : URL.createObjectURL(newReport.imageUrl);

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-28 font-sans">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/reportIssue")}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Final Step</p>
            <h1 className="text-xl font-black text-gray-900">Review & Submit</h1>
          </div>
        </div>

        {/* Preview image */}
        <img
          src={imagePreview}
          alt="Report"
          className="w-full h-52 object-cover rounded-2xl shadow-sm border border-gray-100"
        />

        {/* Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</p>
          {[
            { label: "Issue Type",   value: newReport.title,                  capitalize: true },
            { label: "Description",  value: newReport.description || "—"                       },
            { label: "Location",     value: newReport.location?.address || "—"                 },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-gray-400">{row.label}</span>
              <span className={`text-sm text-gray-800 font-medium ${row.capitalize ? "capitalize" : ""}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
            <AlertTriangle size={15} className="shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:shadow-none"
        >
          {submitting ? (
            <><Loader size={18} className="animate-spin" /> Submitting…</>
          ) : (
            "Submit Report"
          )}
        </button>
      </div>
    </div>
  );
};
