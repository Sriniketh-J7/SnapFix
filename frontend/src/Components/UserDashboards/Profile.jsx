import { useContext } from "react";
import { UserContext } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const Profile = () => {
  const { userData, logout } = useContext(UserContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-28 font-sans">
      <div className="max-w-md mx-auto px-5 py-8 space-y-5">
        <div>
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Account</p>
          <h1 className="text-xl font-black text-gray-900">My Profile</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-blue-100">
            {userData?.userName?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="text-center">
            <p className="font-black text-gray-900 text-xl">{userData?.userName || "—"}</p>
            <p className="text-sm text-gray-400 mt-1">Citizen Account</p>
          </div>
          <button onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition text-sm border border-red-100">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
