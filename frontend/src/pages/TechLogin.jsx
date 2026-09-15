import { useContext, useState } from "react";
import { TechnicianContext } from "../contexts/TechnicianContext";
import { useNavigate } from "react-router-dom";
import { KeyRound, UserRound, ArrowRight } from "lucide-react";

export const TechLogin = () => {
  const { login } = useContext(TechnicianContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) navigate("/TechDashboard");
      else setError("Invalid credentials.");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-200">
            <span className="text-white font-black text-xl">T</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Technician Login</h1>
          <p className="text-sm text-gray-400 mt-1">Access your task dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Username", type: "text", val: username, set: setUsername, icon: <UserRound size={16} className="text-gray-300 mr-3 shrink-0" />, ph: "Enter username" },
              { label: "Password", type: "password", val: password, set: setPassword, icon: <KeyRound size={16} className="text-gray-300 mr-3 shrink-0" />, ph: "Enter password" },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-50 transition">
                  {f.icon}
                  <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-gray-800 text-sm" required />
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition mt-2">
              {loading ? "Signing in…" : <> Sign In <ArrowRight size={15} /> </>}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-5">
            Citizen?{" "}
            <button onClick={() => navigate("/login")} className="text-blue-600 font-semibold hover:underline">Login here</button>
          </p>
        </div>
      </div>
    </div>
  );
};
