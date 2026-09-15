import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export async function login(username, password) {
  try {
    const response = await axios.post("/api/technician/login", { userName: username, password });
    if (response.data.success) {
      let token = response.headers["authorization"];
      if (token?.startsWith("Bearer ")) token = token.split(" ")[1];
      localStorage.setItem("techAuth", token);
      return true;
    }
    throw new Error(response.data.message || "Login failed");
  } catch (error) { throw error; }
}

export async function getTasks() {
  try {
    const token = localStorage.getItem("techAuth");
    if (!token) return null;
    const { data } = await axios.get("/api/technician/alltasks", { headers: { Authorization: `Bearer ${token}` } });
    return data.success ? data.tasksAssigned : null;
  } catch { return null; }
}

export async function singleTask(id) {
  try {
    const token = localStorage.getItem("techAuth");
    if (!token) return null;
    const { data } = await axios.get(`/api/technician/task/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    return data.success ? data.report : null;
  } catch { return null; }
}

export async function startTask(id) {
  try {
    const token = localStorage.getItem("techAuth");
    if (!token) return null;
    const { data } = await axios.patch(`/api/technician/task/${id}/start`, {}, { headers: { Authorization: `Bearer ${token}` } });
    return data.success ? data.report : null;
  } catch { return null; }
}

export async function resolveTask(id, photo) {
  try {
    if (!id || !photo) throw new Error("id and photo required");
    const token = localStorage.getItem("techAuth");
    if (!token) return null;
    const formData = new FormData();
    formData.append("photo", photo);
    const { data } = await axios.patch(`/api/technician/task/${id}/resolve`, formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    });
    if (data.success) return { message: data.message, report: data.report };
    throw new Error(data.message);
  } catch (error) { throw error; }
}

export async function getOptimizedRoute() {
  try {
    const token = localStorage.getItem("techAuth");
    if (!token) return null;
    const { data } = await axios.get("/api/technician/route", { headers: { Authorization: `Bearer ${token}` } });
    return data.success ? { route: data.route, techLocation: data.techLocation } : null;
  } catch { return null; }
}

export async function updateTechLocation(latitude, longitude) {
  try {
    const token = localStorage.getItem("techAuth");
    if (!token) return;
    await axios.post("/api/technician/location", { latitude, longitude }, { headers: { Authorization: `Bearer ${token}` } });
  } catch { /* silent */ }
}

export async function checkAuth() {
  try {
    const token = localStorage.getItem("techAuth");
    if (!token) return null;
    const { data } = await axios.get("/api/technician/checkAuth", { headers: { Authorization: `Bearer ${token}` } });
    return data.success ? data.techData : null;
  } catch { return null; }
}
