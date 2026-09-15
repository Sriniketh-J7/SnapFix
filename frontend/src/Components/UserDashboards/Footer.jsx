import { NavLink } from "react-router-dom";
import { Home, FileText, Map, User } from "lucide-react";

const LINKS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/userReportsPage", icon: FileText, label: "Reports" },
  { to: "/explore", icon: Map, label: "Explore" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const FooterNav = () => (
  <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-t border-gray-100">
    <div className="flex justify-around items-center py-2 max-w-xl mx-auto px-2">
      {LINKS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
              isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-blue-50" : ""}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              </span>
              <span className="text-[10px] font-semibold">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);
