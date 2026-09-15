import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  signup as signUpApi,
  login as loginApi,
  createReport as createReportApi,
  myReports as myReportsApi,
  singleReport as singleReportApi,
  checkAuth as checkAuthApi,
  submitFeedback as submitFeedbackApi,
} from "../apis/UserApi";
import { getSocket } from "../lib/socket";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newReport, setNewReport] = useState({});
  const [notifications, setNotifications] = useState([]);

  const signup = async (username, password) => {
    const success = await signUpApi(username, password);
    if (success) await checkAuth();
    return success;
  };

  const login = async (username, password) => {
    const success = await loginApi(username, password);
    if (success) await checkAuth();
    return success;
  };

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const data = await checkAuthApi();
    setUserData(data ? { ...data, role: "citizen" } : null);
    setLoading(false);
    return data;
  }, []);

  const logout = () => {
    localStorage.removeItem("userAuth");
    setUserData(null);
    setNotifications([]);
  };

  const myReports = async () => {
    const data = await myReportsApi();
    return data;
  };

  const singleReport = async (id) => {
    setLoading(true);
    const data = await singleReportApi(id);
    setLoading(false);
    return data;
  };

  const createReport = async () => {
    setLoading(true);
    try {
      const data = await createReportApi(newReport);
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const submitFeedback = async (reportId, feedback) => {
    return await submitFeedbackApi(reportId, feedback);
  };

  const dismissNotification = (index) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  // Setup socket for real-time notifications
  useEffect(() => {
    checkAuth().then((data) => {
      if (data?._id) {
        const socket = getSocket();
        socket.emit("register_user", data._id.toString());
        socket.on("report_status_updated", (payload) => {
          setNotifications((prev) => [payload, ...prev.slice(0, 9)]);
        });
      }
    });

    return () => {
      const socket = getSocket();
      socket.off("report_status_updated");
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,
        newReport,
        notifications,
        setNewReport,
        setUserData,
        setLoading,
        login,
        logout,
        signup,
        myReports,
        singleReport,
        createReport,
        checkAuth,
        submitFeedback,
        dismissNotification,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
