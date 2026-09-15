import { useContext, useEffect, useState } from "react";
import { TechnicianContext } from "../contexts/TechnicianContext";
import { ComplainBox } from "../Components/TechDashBoard/Complain_box";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw, AlertCircle, Loader, Bell, Map, List } from "lucide-react";
import RouteMap from "../Components/TechDashBoard/RouteMap";

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const STATUS_TABS = ["All", "Assigned", "In Progress", "Resolved"];

export const TechDashboard = () => {
  const { techData, loading, getTasks, logout, newTaskNotif, setNewTaskNotif } = useContext(TechnicianContext);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [fetching, setFetching] = useState(true);
  const [view, setView] = useState("list"); // "list" | "route"
  const navigate = useNavigate();

  const fetchTasks = async () => {
    setFetching(true);
    const data = await getTasks();
    const sorted = (data || []).sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)
    );
    setTasks(sorted);
    setFetching(false);
  };

  useEffect(() => {
    if (!localStorage.getItem("techAuth")) { navigate("/tech/login"); return; }
    fetchTasks();
  }, []);

  useEffect(() => { if (newTaskNotif) fetchTasks(); }, [newTaskNotif]);

  const handleLogout = () => { logout(); navigate("/tech/login"); };

  const filtered = activeTab === "All" ? tasks : tasks.filter(t => t.status === activeTab);
  const counts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab] = tab === "All" ? tasks.length : tasks.filter(t => t.status === tab).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <header className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white font-black text-sm flex items-center justify-center">
              {techData?.userName?.[0]?.toUpperCase() || "T"}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{techData?.userName || "Technician"}</p>
              <p className="text-xs text-gray-400">{techData?.deptName} Dept</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {newTaskNotif && (
              <button onClick={() => setNewTaskNotif(null)}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                <Bell size={11} /> New
              </button>
            )}
            <button onClick={() => setView(v => v === "list" ? "route" : "list")}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition ${view === "route" ? "bg-blue-600 border-blue-600 text-white" : "hover:bg-gray-100 border-gray-100 text-gray-500"}`}
              title="Route map">
              {view === "route" ? <List size={16} /> : <Map size={16} />}
            </button>
            <button onClick={fetchTasks} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
              <RefreshCw size={16} className="text-gray-400" />
            </button>
            <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 transition">
              <LogOut size={16} className="text-red-400" />
            </button>
          </div>
        </div>
      </header>

      {view === "route" ? (
        <RouteMap />
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total",    count: counts.All,            color: "bg-slate-800"   },
              { label: "Assigned", count: counts.Assigned,       color: "bg-blue-500"    },
              { label: "Active",   count: counts["In Progress"], color: "bg-violet-500"  },
              { label: "Done",     count: counts.Resolved,       color: "bg-emerald-500" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-sm">
                <div className={`${s.color} text-white text-[10px] font-bold rounded-md px-1.5 py-0.5 inline-block mb-1.5`}>{s.label}</div>
                <p className="text-2xl font-black text-gray-900">{s.count}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-4 text-xs text-gray-500">
            <span className="font-semibold text-gray-600">Priority:</span>
            {[["bg-red-600","Critical"],["bg-red-400","High"],["bg-amber-400","Medium"],["bg-gray-300","Low"]].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${c}`} />{l}</span>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {STATUS_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                  activeTab === tab ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-500 border-gray-200"
                }`}>
                {tab} <span className="opacity-60">({counts[tab]})</span>
              </button>
            ))}
          </div>

          {fetching ? (
            <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-400" size={28} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <AlertCircle className="mx-auto text-gray-200 mb-3" size={36} />
              <p className="text-gray-500 font-semibold text-sm">No tasks here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(task => <ComplainBox key={task._id} {...task} onUpdate={fetchTasks} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
