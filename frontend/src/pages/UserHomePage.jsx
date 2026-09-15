import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { Camera, FileText, ArrowRight, TrendingUp, Shield, Zap, Loader } from "lucide-react";

export const UserHomePage = () => {
  const navigate = useNavigate();
  const { userData, loading, myReports } = useContext(UserContext);
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0, pending: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    if (!userData) return;
    myReports().then((reports) => {
      if (!reports) return;
      setStats({
        total: reports.length,
        resolved: reports.filter((r) => r.status === "Resolved").length,
        inProgress: reports.filter((r) => r.status === "In Progress").length,
        pending: reports.filter((r) => r.status === "Pending").length,
      });
      setStatsLoaded(true);
    });
  }, [userData]);

  // While auth is being checked, show a minimal loader so we don't flash wrong page
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <Loader className="animate-spin text-blue-400" size={28} />
      </div>
    );
  }

  /* ─── LOGGED-IN DASHBOARD ─── */
  if (userData) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] pb-28 font-sans">
        <div className="bg-white border-b border-gray-100 px-5 py-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-2xl font-black text-gray-900">
              Welcome back,{" "}
              <span className="text-blue-600">{userData.userName}</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Here is what is happening with your reports.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total",     value: stats.total,      accent: "bg-slate-800" },
              { label: "Pending",   value: stats.pending,    accent: "bg-amber-500" },
              { label: "Active",    value: stats.inProgress, accent: "bg-blue-500"  },
              { label: "Resolved",  value: stats.resolved,   accent: "bg-emerald-500" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center"
              >
                <div className={`${s.accent} text-white text-[10px] font-bold rounded-md px-1.5 py-0.5 inline-block mb-2`}>
                  {s.label}
                </div>
                <p className="text-3xl font-black text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Resolution bar */}
          {statsLoaded && stats.total > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-500" />
                  Resolution Rate
                </p>
                <p className="text-sm font-black text-emerald-600">
                  {Math.round((stats.resolved / stats.total) * 100)}%
                </p>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((stats.resolved / stats.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/reportIssue")}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white rounded-2xl p-5 text-left shadow-lg shadow-blue-100"
            >
              <Camera size={22} className="mb-3 opacity-80" />
              <p className="font-bold text-base">New Report</p>
              <p className="text-xs text-blue-200 mt-0.5">Snap a photo and submit</p>
            </button>
            <button
              onClick={() => navigate("/userReportsPage")}
              className="bg-white hover:bg-gray-50 active:scale-95 transition-all rounded-2xl p-5 text-left border border-gray-100 shadow-sm"
            >
              <FileText size={22} className="mb-3 text-slate-400" />
              <p className="font-bold text-base text-gray-800">My Reports</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.total} submitted
              </p>
            </button>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Issue Categories
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "Road & Civil",   dept: "Civil"          },
                { name: "Water Supply",   dept: "Water"          },
                { name: "Electricity",    dept: "Electrical"     },
                { name: "Sanitation",     dept: "Sanitation"     },
                { name: "Animal Control", dept: "Animal Control" },
                { name: "Traffic Signal", dept: "Electrical"     },
              ].map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => navigate("/reportIssue")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition text-left"
                >
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── LANDING PAGE (logged out) ─── */
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero */}
      <div className="relative w-full" style={{ minHeight: "92vh" }}>
        {/* Background image - src must match file in /public */}
        <img
          src="/hero-civic.jpg"
          alt="Citizens using SnapFix"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => {
            // Fallback gradient if image fails
            e.currentTarget.style.display = "none";
          }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        {/* Hero content */}
        <div
          className="relative z-10 flex flex-col justify-end px-6 pb-20 max-w-2xl mx-auto"
          style={{ minHeight: "92vh" }}
        >
          <span className="inline-block bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm mb-4 w-fit">
            AI-Powered Civic Platform
          </span>
          <h1 className="text-5xl font-black text-white leading-tight">
            Fix your city,
            <br />
            <span className="text-blue-400">one snap</span> at a time.
          </h1>
          <p className="text-gray-300 text-base mt-4 max-w-sm leading-relaxed">
            Report civic issues instantly. AI classifies them, the right
            department gets notified, and you track resolution live.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={() => navigate("/signup")}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-4 rounded-2xl text-sm transition active:scale-95 shadow-xl shadow-blue-900/30"
            >
              Get Started Free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold px-7 py-4 rounded-2xl text-sm transition backdrop-blur-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/reportIssue")}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold px-7 py-4 rounded-2xl text-sm transition backdrop-blur-sm"
            >
              <Camera size={15} /> Report Now
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#f8f9fc] py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest text-center mb-2">
            How it works
          </p>
          <h2 className="text-3xl font-black text-gray-900 text-center mb-12">
            From snap to solved
          </h2>
          <div className="space-y-4">
            {[
              {
                n: "01", icon: <Camera size={20} />,
                title: "Capture",
                desc: "Photograph the issue anywhere in your city.",
              },
              {
                n: "02", icon: <Zap size={20} />,
                title: "AI Classifies",
                desc: "Gemini AI reads your image and routes it to the correct department with a priority level.",
              },
              {
                n: "03", icon: <Shield size={20} />,
                title: "Auto-Assigned",
                desc: "The best available technician in that department gets the task instantly.",
              },
              {
                n: "04", icon: <TrendingUp size={20} />,
                title: "Live Updates",
                desc: "Real-time notifications the moment a technician starts or resolves your report.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="flex gap-5 items-start bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  {step.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-400 mb-0.5">{step.n}</p>
                  <p className="font-bold text-gray-800">{step.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-sm transition shadow-lg shadow-blue-100"
            >
              Create Free Account <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
