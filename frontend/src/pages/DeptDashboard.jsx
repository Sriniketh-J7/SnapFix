import { useContext, useEffect, useState } from "react";
import { DepartmentContext } from "../contexts/DepartmentContext";
import { useNavigate } from "react-router-dom";
import { FileText, Users, LogOut, RefreshCw, Zap, Loader, TrendingUp, ArrowRight, AlertTriangle, X } from "lucide-react";

export const DeptDashboard = () => {
  const { deptData, getAllReports, getAllTechnicians, triggerAutoAssign, logout, escalationAlerts, dismissAlert } = useContext(DepartmentContext);
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [techs, setTechs] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [autoMsg, setAutoMsg] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("deptAuth")) { navigate("/dept/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setFetching(true);
    const [r, t] = await Promise.all([getAllReports(), getAllTechnicians()]);
    setReports(r || []);
    setTechs(t || []);
    setFetching(false);
  };

  const handleAutoAssign = async () => {
    const res = await triggerAutoAssign();
    setAutoMsg(res?.message || "Done");
    loadData();
    setTimeout(() => setAutoMsg(null), 3000);
  };

  const stats = {
    total:     reports.length,
    pending:   reports.filter(r => r.status === "Pending").length,
    inProgress:reports.filter(r => r.status === "In Progress").length,
    resolved:  reports.filter(r => r.status === "Resolved").length,
    escalated: reports.filter(r => r.status === "Escalated").length,
    critical:  reports.filter(r => r.priority === "Critical").length,
    available: techs.filter(t => t.status === "Available").length,
  };
  const resRate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
      <Loader className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Department</p>
            <h1 className="font-black text-gray-900 text-lg">{deptData?.deptName || "—"}</h1>
          </div>
          <div className="flex items-center gap-2">
            {escalationAlerts.length > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1.5">
                <AlertTriangle size={11} /> {escalationAlerts.length} Escalated
              </span>
            )}
            <button onClick={loadData} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
              <RefreshCw size={16} className="text-gray-400" />
            </button>
            <button onClick={() => { logout(); navigate("/dept/login"); }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 transition">
              <LogOut size={16} className="text-red-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">
        {/* Escalation alerts */}
        {escalationAlerts.map((alert, i) => (
          <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p className="text-sm flex-1 font-medium">{alert.message}</p>
            <button onClick={() => dismissAlert(i)} className="shrink-0 text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        ))}

        {autoMsg && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl font-medium">{autoMsg}</div>
        )}

        {/* Stat grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",     value: stats.total,      color: "bg-slate-800"   },
            { label: "Pending",   value: stats.pending,    color: "bg-amber-500"   },
            { label: "Active",    value: stats.inProgress, color: "bg-violet-500"  },
            { label: "Resolved",  value: stats.resolved,   color: "bg-emerald-500" },
            { label: "Escalated", value: stats.escalated,  color: "bg-red-600"     },
            { label: "Critical",  value: stats.critical,   color: "bg-red-400"     },
            { label: "Available Techs", value: stats.available, color: "bg-blue-500" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
              <div className={`${s.color} text-white text-[10px] font-bold rounded-md px-1.5 py-0.5 inline-block mb-1.5 leading-tight`}>{s.label}</div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Resolution bar */}
        {stats.total > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-500" /> Resolution Rate
              </p>
              <p className="text-sm font-black text-emerald-600">{resRate}%</p>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700" style={{ width: `${resRate}%` }} />
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => navigate("/DeptReports")}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition text-left group">
            <FileText className="text-indigo-400 mb-3 group-hover:text-indigo-600 transition" size={22} />
            <p className="font-bold text-gray-800 text-sm">All Reports</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">View & assign <ArrowRight size={11} /></p>
          </button>
          <button onClick={() => navigate("/DeptTechnicians")}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition text-left group">
            <Users className="text-indigo-400 mb-3 group-hover:text-indigo-600 transition" size={22} />
            <p className="font-bold text-gray-800 text-sm">Technicians</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">Manage team <ArrowRight size={11} /></p>
          </button>
          <button onClick={handleAutoAssign}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all rounded-2xl p-5 text-left shadow-lg shadow-indigo-100">
            <Zap className="text-white/80 mb-3" size={22} />
            <p className="font-bold text-white text-sm">Auto-Assign</p>
            <p className="text-xs text-indigo-200 mt-0.5">Assign all pending by priority + proximity</p>
          </button>
        </div>

        {/* Escalated reports list */}
        {stats.escalated > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
            <p className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Escalated Reports</p>
            <div className="space-y-2">
              {reports.filter(r => r.status === "Escalated").slice(0, 5).map(r => (
                <button key={r._id} onClick={() => navigate(`/dept/report/${r._id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 transition text-left border border-red-100">
                  <span className="text-sm font-medium text-gray-800 capitalize">{r.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-200 text-red-700 font-bold">Escalated</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Critical reports */}
        {stats.critical > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2"><Zap size={14} /> Critical Priority</p>
            <div className="space-y-2">
              {reports.filter(r => r.priority === "Critical" && r.status !== "Escalated").slice(0, 5).map(r => (
                <button key={r._id} onClick={() => navigate(`/dept/report/${r._id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition text-left border border-orange-100">
                  <span className="text-sm font-medium text-gray-800 capitalize">{r.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold">{r.status}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
