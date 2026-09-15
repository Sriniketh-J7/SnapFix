import { useContext } from "react";
import { UserContext } from "../../contexts/UserContext";
import { TechnicianContext } from "../../contexts/TechnicianContext";
import { DepartmentContext } from "../../contexts/DepartmentContext";
import { X, CheckCircle, Bell, AlertTriangle } from "lucide-react";

function UserToast() {
  const ctx = useContext(UserContext);
  if (!ctx?.notifications?.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-xs w-full">
      {ctx.notifications.slice(0, 3).map((n, i) => (
        <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 shadow-lg rounded-2xl p-4 animate-slide-in">
          <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">{n.status}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
          </div>
          <button onClick={() => ctx.dismissNotification(i)} className="text-gray-300 hover:text-gray-500 shrink-0">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function TechToast() {
  const ctx = useContext(TechnicianContext);
  if (!ctx?.newTaskNotif) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-xs w-full animate-slide-in">
      <div className="flex items-start gap-3 bg-blue-600 text-white shadow-lg rounded-2xl p-4">
        <Bell className="mt-0.5 shrink-0" size={16} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide">New Task Assigned</p>
          <p className="text-xs opacity-80 mt-0.5">{ctx.newTaskNotif.message}</p>
        </div>
        <button onClick={() => ctx.setNewTaskNotif(null)} className="opacity-60 hover:opacity-100">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

function DeptToast() {
  const ctx = useContext(DepartmentContext);
  if (!ctx?.escalationAlerts?.length) return null;
  const latest = ctx.escalationAlerts[0];
  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-xs w-full animate-slide-in">
      <div className="flex items-start gap-3 bg-red-600 text-white shadow-lg rounded-2xl p-4">
        <AlertTriangle className="mt-0.5 shrink-0" size={16} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide">Report Escalated</p>
          <p className="text-xs opacity-80 mt-0.5">{latest.message}</p>
        </div>
        <button onClick={() => ctx.dismissAlert(0)} className="opacity-60 hover:opacity-100">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

export function NotificationToast() {
  return (
    <>
      <UserToast />
      <TechToast />
      <DeptToast />
    </>
  );
}
