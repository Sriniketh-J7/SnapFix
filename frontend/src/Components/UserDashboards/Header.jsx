import { Bell, Menu, X, LogOut, ChevronRight } from "lucide-react";
import { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";

export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();
  const { userData, logout, notifications, dismissNotification } = useContext(UserContext);
  const notifRef = useRef(null);

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };
  const unread = notifications?.length || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 max-w-5xl mx-auto">
        {/* Logo */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition">
            <span className="text-white font-black text-sm">S</span>
          </div>
          <span className="font-black text-gray-900 text-base tracking-tight">SnapFix</span>
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs((p) => !p)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
            >
              <Bell size={18} className="text-gray-600" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-bold text-gray-800 text-sm">Notifications</p>
                  {unread > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{unread} new</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications?.length ? (
                    notifications.map((n, i) => (
                      <div key={i} className="px-4 py-3 hover:bg-gray-50 transition flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">{n.status}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                        <button onClick={() => dismissNotification(i)} className="text-gray-300 hover:text-gray-500 mt-0.5 shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User avatar / login */}
          {userData ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate("/profile")}
                className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center hover:bg-blue-700 transition"
              >
                {userData.userName?.[0]?.toUpperCase()}
              </button>
              <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 transition" title="Logout">
                <LogOut size={16} className="text-gray-400 hover:text-red-500 transition" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-1 text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
            >
              Sign In <ChevronRight size={14} />
            </button>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
          >
            {menuOpen ? <X size={18} className="text-gray-700" /> : <Menu size={18} className="text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute right-4 top-16 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
          {[
            { label: "Home", path: "/" },
            { label: "My Reports", path: "/userReportsPage" },
            { label: "Explore", path: "/explore" },
            { label: "Profile", path: "/profile" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMenuOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition"
            >
              {item.label}
            </button>
          ))}
          {!userData && (
            <button
              onClick={() => { navigate("/login"); setMenuOpen(false); }}
              className="w-full text-center px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
};
