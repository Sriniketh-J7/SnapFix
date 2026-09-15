import { useContext, useState } from "react";
import { DepartmentContext } from "../contexts/DepartmentContext";
import { useNavigate } from "react-router-dom";
import { KeyRound, UserRound, ArrowRight } from "lucide-react";

export const DeptLogin = () => {
  const { loginDept } = useContext(DepartmentContext);
  const navigate = useNavigate();
  const [headName, setHeadName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await loginDept(headName, password);
      if (result?.success) navigate("/DeptOverview");
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
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-100">
            <span className="text-white font-black text-xl">D</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Department Login</h1>
          <p className="text-sm text-gray-400 mt-1">Access your department dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Department Head Name", type: "text", val: headName, set: setHeadName, icon: <UserRound size={16} className="text-gray-300 mr-3 shrink-0" />, ph: "Enter head name" },
              { label: "Password", type: "password", val: password, set: setPassword, icon: <KeyRound size={16} className="text-gray-300 mr-3 shrink-0" />, ph: "Enter password" },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition">
                  {f.icon}
                  <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-gray-800 text-sm" required />
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition mt-2">
              {loading ? "Signing in…" : <> Sign In <ArrowRight size={15} /> </>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
