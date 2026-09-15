import { useContext, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { KeyRound, UserRound, ArrowRight } from "lucide-react";

export const SignUp = () => {
  const { signup } = useContext(UserContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError(null);
    setLoading(true);
    try {
      const success = await signup(username, password);
      if (success) navigate("/");
      else setError("Username already taken. Try another.");
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-100">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Create account</h1>
          <p className="text-sm text-gray-400 mt-1">Join SnapFix and start reporting civic issues</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Username", type: "text", val: username, set: setUsername, icon: <UserRound size={16} className="text-gray-300 mr-3 shrink-0" />, ph: "Choose a username" },
              { label: "Password", type: "password", val: password, set: setPassword, icon: <KeyRound size={16} className="text-gray-300 mr-3 shrink-0" />, ph: "Min 6 characters" },
              { label: "Confirm Password", type: "password", val: confirm, set: setConfirm, icon: <KeyRound size={16} className="text-gray-300 mr-3 shrink-0" />, ph: "Repeat password" },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
                  {f.icon}
                  <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-gray-800 text-sm" required />
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition mt-2">
              {loading ? "Creating…" : <> Create Account <ArrowRight size={15} /> </>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-blue-600 font-semibold hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
};
