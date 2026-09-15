import { useContext, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { KeyRound, UserRound, Wrench, Building2, ArrowRight } from "lucide-react";

export const SignIn = () => {
  const { login } = useContext(UserContext);
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
      if (success) navigate("/");
      else setError("Invalid username or password.");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-100">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to your SnapFix account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Username</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
                <UserRound className="text-gray-300 mr-3 shrink-0" size={16} />
                <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-800 text-sm" required />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
                <KeyRound className="text-gray-300 mr-3 shrink-0" size={16} />
                <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-800 text-sm" required />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition mt-2">
              {loading ? "Signing in…" : <> Sign In <ArrowRight size={15} /> </>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            No account?{" "}
            <button onClick={() => navigate("/signup")} className="text-blue-600 font-semibold hover:underline">
              Create one
            </button>
          </p>
        </div>

        {/* Other portals */}
        <div className="mt-5 space-y-2">
          <p className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Other portals</p>
          <button onClick={() => navigate("/tech/login")}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 transition shadow-sm">
            <Wrench size={15} className="text-blue-400" /> Technician Portal
          </button>
          <button onClick={() => navigate("/dept/login")}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 transition shadow-sm">
            <Building2 size={15} className="text-indigo-400" /> Department Portal
          </button>
        </div>
      </div>
    </div>
  );
};
