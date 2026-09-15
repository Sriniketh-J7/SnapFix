import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export async function loginDept(deptHeadName, password) {
  try {
    const response = await axios.post("/api/department/loginDept", { deptHeadName, password });
    if (response.data.success) {
      let token = response.headers["authorization"];
      if (token?.startsWith("Bearer ")) token = token.split(" ")[1];
      localStorage.setItem("deptAuth", token);
      return { success: true, dept: response.data.dept };
    }
    throw new Error(response.data.message || "Login failed");
  } catch (error) {
    console.error("Dept Login Error:", error.message);
    throw error;
  }
}

export async function checkAuth() {
  try {
    const token = localStorage.getItem("deptAuth");
    if (!token) return null;
    const { data } = await axios.get("/api/department/checkAuth", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data.success) return data.deptData;
    return null;
  } catch (error) {
    return null;
  }
}

export async function getAllReports() {
  try {
    const token = localStorage.getItem("deptAuth");
    const { data } = await axios.get("/api/department/allreports", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.success ? data.reports : [];
  } catch (error) {
    console.error(error.message);
    return [];
  }
}

export async function getSingleReport(id) {
  try {
    const token = localStorage.getItem("deptAuth");
    const { data } = await axios.get(`/api/department/singleReport/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.success ? data.report : null;
  } catch (error) {
    return null;
  }
}

export async function getAllTechnicians() {
  try {
    const token = localStorage.getItem("deptAuth");
    const { data } = await axios.get("/api/department/allTechnicians", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.success ? data.technicians : [];
  } catch (error) {
    return [];
  }
}

export async function assignTechnicianToReport(reportId, technicianId) {
  try {
    const token = localStorage.getItem("deptAuth");
    const { data } = await axios.post(
      `/api/department/assignTechnician/${reportId}/assign`,
      { technicianId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (error) {
    console.error(error.message);
    return { success: false };
  }
}

export async function createTechnician(techData) {
  try {
    const token = localStorage.getItem("deptAuth");
    const { data } = await axios.post("/api/department/createTechnician", techData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error) {
    console.error(error.message);
    return { success: false };
  }
}

export async function triggerAutoAssign() {
  try {
    const token = localStorage.getItem("deptAuth");
    const { data } = await axios.post("/api/department/autoAssign", {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error) {
    return { success: false };
  }
}
