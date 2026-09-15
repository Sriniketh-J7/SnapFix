import { useContext, useEffect, useState } from "react";
import { DepartmentContext } from "../contexts/DepartmentContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Loader, CheckCircle, AlertCircle } from "lucide-react";

const STATUS_STYLE = {
  Available: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  Busy:      "bg-amber-50 text-amber-600 border border-amber-100",
  Inactive:  "bg-gray-50 text-gray-400 border border-gray-100",
};

export const DeptTechnician = () => {
  const { getAllTechnicians, createTechnician } = useContext(DepartmentContext);
  const navigate = useNavigate();
  const [techs, setTechs] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userName: "", password: "", email: "", phoneNo: "" });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => { setFetching(true); const d = await getAllTechnicians(); setTechs(d || []); setFetching(false); };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMsg(null);
    const result = await createTechnician(form);
    if (result?.success) {
      setMsg({ type: "success", text: "Technician created successfully." });
      setForm({ userName: "", password: "", email: "", phoneNo: "" });
      setShowForm(false);
      load();
    } else {
      setMsg({ type: "error", text: result?.message || "Failed to create technician." });
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/DeptOverview")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
            <div>
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Team</p>
              <h1 className="font-black text-gray-900 text-base">Technicians</h1>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm shadow-indigo-100">
            <Plus size={15} /> Add
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-5 space-y-4">
        {msg && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${
            msg.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
          }`}>
            {msg.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {msg.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: techs.length, color: "bg-slate-800" },
            { label: "Available", value: techs.filter(t => t.status === "Available").length, color: "bg-emerald-500" },
            { label: "Busy", value: techs.filter(t => t.status === "Busy").length, color: "bg-amber-500" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
              <div className={`${s.color} text-white text-[10px] font-bold rounded-md px-1.5 py-0.5 inline-block mb-1.5`}>{s.label}</div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {fetching ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-indigo-400" size={28} /></div>
        ) : techs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 font-semibold text-sm">No technicians yet</p>
            <p className="text-xs text-gray-400 mt-1">Add one using the button above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {techs.map(t => (
              <div key={t._id} className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                  {t.userName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{t.userName}</p>
                  <p className="text-xs text-gray-400 truncate">{t.email}</p>
                  {t.phoneNo && <p className="text-xs text-gray-400">{t.phoneNo}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[t.status] || ""}`}>{t.status}</span>
                  {t.performance?.totalResolved != null && (
                    <p className="text-xs text-gray-400">{t.performance.totalResolved} resolved</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-gray-900 text-base">Add New Technician</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            {msg?.type === "error" && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{msg.text}</p>}
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { key: "userName", label: "Username", type: "text" },
                { key: "email", label: "Email", type: "email" },
                { key: "phoneNo", label: "Phone Number", type: "text" },
                { key: "password", label: "Password", type: "password" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                  <input type={f.type} required value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white font-bold rounded-xl transition text-sm">
                  {creating ? "Creating…" : "Create Technician"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
