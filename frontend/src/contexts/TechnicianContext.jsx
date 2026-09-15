import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  login as loginApi,
  getTasks as getTasksApi,
  singleTask as singleTaskApi,
  startTask as startTaskApi,
  resolveTask as resolveTaskApi,
  checkAuth as checkAuthApi,
  getOptimizedRoute as getRouteApi,
  updateTechLocation,
} from "../apis/TechnicianApi";
import { getSocket } from "../lib/socket";

export const TechnicianContext = createContext();

export const TechnicianProvider = ({ children }) => {
  const [techData, setTechData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTaskNotif, setNewTaskNotif] = useState(null);

  const login = async (username, password) => {
    const success = await loginApi(username, password);
    if (success) await checkAuth();
    return success;
  };

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const data = await checkAuthApi();
    setTechData(data || null);
    setLoading(false);
    return data;
  }, []);

  const logout = () => {
    localStorage.removeItem("techAuth");
    setTechData(null);
    setNewTaskNotif(null);
  };

  const getTasks = async () => await getTasksApi();
  const getSingleTask = async (id) => { setLoading(true); const d = await singleTaskApi(id); setLoading(false); return d; };
  const resolveTask = async (id, photo) => await resolveTaskApi(id, photo);
  const startTask = async (id) => await startTaskApi(id);
  const getOptimizedRoute = async () => await getRouteApi();

  useEffect(() => {
    checkAuth().then((data) => {
      if (!data?._id) return;

      // Register socket
      const socket = getSocket();
      socket.emit("register_technician", data._id.toString());
      socket.on("new_task_assigned", (payload) => setNewTaskNotif(payload));

      // Push location to backend for geo-nearest assignment
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => updateTechLocation(coords.latitude, coords.longitude),
          () => {} // silent fail
        );
      }
    });

    return () => {
      const socket = getSocket();
      socket.off("new_task_assigned");
    };
  }, []);

  return (
    <TechnicianContext.Provider value={{
      techData, loading, newTaskNotif,
      setNewTaskNotif, setLoading,
      login, logout, getTasks, getSingleTask,
      resolveTask, startTask, checkAuth, getOptimizedRoute,
    }}>
      {children}
    </TechnicianContext.Provider>
  );
};
