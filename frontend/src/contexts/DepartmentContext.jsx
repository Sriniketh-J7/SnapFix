import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  loginDept as loginApi, checkAuth as checkAuthApi,
  getAllReports as getAllReportsApi, getSingleReport as getSingleReportApi,
  getAllTechnicians as getAllTechniciansApi, assignTechnicianToReport as assignApi,
  createTechnician as createTechApi, triggerAutoAssign as autoAssignApi,
} from "../apis/DepartmentApi";
import { getSocket } from "../lib/socket";

export const DepartmentContext = createContext();

export const DepartmentProvider = ({ children }) => {
  const [deptData, setDeptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [escalationAlerts, setEscalationAlerts] = useState([]);

  const loginDept = async (headName, password) => {
    const result = await loginApi(headName, password);
    if (result.success) await checkAuth();
    return result;
  };

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const data = await checkAuthApi();
    setDeptData(data || null);
    setLoading(false);
    return data;
  }, []);

  const logout = () => { localStorage.removeItem("deptAuth"); setDeptData(null); setEscalationAlerts([]); };

  const getAllReports    = async () => await getAllReportsApi();
  const getSingleReport = async (id) => await getSingleReportApi(id);
  const getAllTechnicians = async () => await getAllTechniciansApi();
  const assignTechnician = async (reportId, technicianId) => await assignApi(reportId, technicianId);
  const createTechnician = async (data) => await createTechApi(data);
  const triggerAutoAssign = async () => await autoAssignApi();
  const dismissAlert = (idx) => setEscalationAlerts(p => p.filter((_, i) => i !== idx));

  useEffect(() => {
    checkAuth().then((data) => {
      if (!data?.deptName) return;
      const socket = getSocket();
      // Join dept room so escalation broadcasts are received
      socket.emit("register_dept", data.deptName);
      socket.on("report_escalated", (payload) => {
        setEscalationAlerts(prev => [payload, ...prev.slice(0, 9)]);
      });
    });
    return () => { getSocket().off("report_escalated"); };
  }, []);

  return (
    <DepartmentContext.Provider value={{
      deptData, loading, escalationAlerts,
      setLoading, loginDept, logout, checkAuth,
      getAllReports, getSingleReport, getAllTechnicians,
      assignTechnician, createTechnician, triggerAutoAssign, dismissAlert,
    }}>
      {children}
    </DepartmentContext.Provider>
  );
};
