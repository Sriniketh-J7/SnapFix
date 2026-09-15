import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export async function signup(username, password) {
  try {
    const response = await axios.post("/api/user/signup", { userName: username, password });
    if (response.data.success) {
      let token = response.headers["authorization"];
      if (token?.startsWith("Bearer ")) token = token.split(" ")[1];
      localStorage.setItem("userAuth", token);
      return true;
    }
    throw new Error(response.data.message || "Signup failed");
  } catch (error) { throw error; }
}

export async function login(username, password) {
  try {
    const response = await axios.post("/api/user/login", { userName: username, password });
    if (response.data.success) {
      let token = response.headers["authorization"];
      if (token?.startsWith("Bearer ")) token = token.split(" ")[1];
      localStorage.setItem("userAuth", token);
      return true;
    }
    throw new Error(response.data.message || "Login failed");
  } catch (error) { throw error; }
}

export async function myReports() {
  try {
    const token = localStorage.getItem("userAuth");
    if (!token) return null;
    const { data } = await axios.get("/api/report/myReports", { headers: { Authorization: `Bearer ${token}` } });
    return data.success ? data.reportDetails : null;
  } catch { return null; }
}

// All city reports - optional lat/lng/radius for geo filter
export async function cityReports(lat, lng, radius = 10) {
  try {
    const params = lat && lng ? { lat, lng, radius } : {};
    const { data } = await axios.get("/api/report/city", { params });
    return data.success ? data.reports : [];
  } catch { return []; }
}

// Heatmap data
export async function heatmapData() {
  try {
    const { data } = await axios.get("/api/report/heatmap");
    return data.success ? data.points : [];
  } catch { return []; }
}

// Upvote toggle
export async function upvoteReport(reportId) {
  try {
    const token = localStorage.getItem("userAuth");
    if (!token) throw new Error("Not authenticated");
    const { data } = await axios.post(`/api/report/upvote/${reportId}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error) { throw error; }
}

export async function singleReport(id) {
  try {
    const { data } = await axios.get(`/api/report/singleReport/${id}`);
    return data.success ? data.report : null;
  } catch { return null; }
}

export async function createReport(report) {
  try {
    if (!report?.title || !report?.imageUrl || !report?.location) throw new Error("Missing fields");
    const token = localStorage.getItem("userAuth");
    if (!token) throw new Error("Not authenticated");
    const formData = new FormData();
    formData.append("image", report.imageUrl);
    formData.append("title", report.title);
    formData.append("description", report.description || "");
    formData.append("location", JSON.stringify(report.location));
    const { data } = await axios.post("/api/report/create", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data.success) return { message: data.message, report: data.report };
    throw new Error(data.message || "Failed to create report");
  } catch (error) { throw error; }
}

export async function submitFeedback(reportId, feedback) {
  try {
    const token = localStorage.getItem("userAuth");
    if (!token) return null;
    const { data } = await axios.post(`/api/report/feedback/${reportId}`, { feedback }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch { return null; }
}

export async function checkAuth() {
  try {
    const token = localStorage.getItem("userAuth");
    if (!token) return null;
    const { data } = await axios.get("/api/user/checkAuth", { headers: { Authorization: `Bearer ${token}` } });
    return data.success ? data.userData : null;
  } catch { return null; }
}
