import Technician from "../models/technician.model.js";
import generateToken from "../utils/generateToken.js";
import Report from "../models/report.model.js";
import bcrypt from "bcrypt";
import { emitToUser } from "../index.js";
import { optimizeRoute } from "../utils/Assignment.js";

export const signup = async (req, res) => {
  try {
    const { userName, email, password, deptName } = req.body;
    if (!userName || !password) return res.status(400).json({ message: "Missing Fields", success: false });
    if (await Technician.findOne({ userName }))
      return res.status(400).json({ message: "Username Already Exists", success: false });
    const hashedPass = await bcrypt.hash(password, 10);
    const technician = new Technician({ userName, email, deptName, password: hashedPass });
    await technician.save();
    const token = generateToken({ id: technician._id, role: "technician" });
    res.setHeader("Authorization", `Bearer ${token}`);
    res.setHeader("Access-Control-Expose-Headers", "Authorization");
    res.status(201).json({ message: "Token Generated Successfully", success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const logintech = async (req, res) => {
  const { userName, password } = req.body;
  try {
    if (!userName || !password)
      return res.status(400).json({ message: !userName ? "Username required" : "Password required", success: false });
    const technician = await Technician.findOne({ userName });
    if (!technician) return res.status(400).json({ message: "Username not Found!", success: false });
    const valid = await bcrypt.compare(password, technician.password);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const token = generateToken({ id: technician._id, role: "technician" });
    res.setHeader("Authorization", `Bearer ${token}`);
    res.setHeader("Access-Control-Expose-Headers", "Authorization");
    return res.status(200).json({ message: "Token Generated Successfully", success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const alltasks = async (req, res) => {
  try {
    const assignedTechId = req.technicianId;
    const technician = await Technician.findById(assignedTechId);
    if (!technician) return res.status(404).json({ message: "Technician not found", success: false });

    const tasks = await Report.find({ assignedTechId })
      .select("_id reportId title imageUrl location status priority priorityScore upvotes createdAt escalated");

    // Priority queue sort: priorityScore DESC, then createdAt ASC
    const sorted = tasks.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    res.json({ technician: technician.userName, tasksAssigned: sorted, success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const singletask = async (req, res) => {
  const { id } = req.params;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: "Task not found", success: false });
    if (!report.assignedTechId || !report.assignedTechId.equals(req.technicianId))
      return res.status(403).json({ message: "This task is not assigned to you", success: false });
    return res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const startTask = async (req, res) => {
  const { id } = req.params;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: "Task not found", success: false });
    if (report.assignedTechId?.toString() !== req.technicianId.toString())
      return res.status(403).json({ message: "Not authorized for this task", success: false });
    report.status = "In Progress";
    report.startedAt = new Date();
    await report.save();
    emitToUser(report.userId?.toString(), "report_status_updated", {
      reportId: report._id, reportRef: report.reportId, status: "In Progress",
      message: `Your report "${report.title}" is now In Progress.`,
    });
    res.json({ message: "Task marked as In Progress", report, success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const resolveTask = async (req, res) => {
  const { id } = req.params;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: "Task not found", success: false });
    if (report.assignedTechId?.toString() !== req.technicianId.toString())
      return res.status(403).json({ message: "Not authorized", success: false });
    if (!req.file) return res.status(400).json({ message: "Resolved image is required", success: false });

    report.resolvedImageUrl = req.file.path || req.file.secure_url;
    report.status = "Resolved";
    report.resolvedTime = new Date();
    await report.save();

    // Resolution time in minutes
    const resolutionMinutes = report.startedAt
      ? Math.round((Date.now() - new Date(report.startedAt).getTime()) / 60000)
      : 0;

    const tech = await Technician.findById(req.technicianId);
    const prevTotal = tech.performance.totalResolved;
    const prevAvg = tech.performance.avgResolutionTime || 0;
    const newAvg = prevTotal > 0
      ? Math.round((prevAvg * prevTotal + resolutionMinutes) / (prevTotal + 1))
      : resolutionMinutes;

    await Technician.findByIdAndUpdate(req.technicianId, {
      $inc: { "performance.totalResolved": 1, "performance.activeTaskCount": -1 },
      "performance.avgResolutionTime": newAvg,
      status: "Available",
    });

    emitToUser(report.userId?.toString(), "report_status_updated", {
      reportId: report._id, reportRef: report.reportId, status: "Resolved",
      message: `Your report "${report.title}" has been Resolved.`,
    });
    res.json({ success: true, message: "Task resolved successfully", report });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Route optimization for technician's active tasks
export const getOptimizedRoute = async (req, res) => {
  try {
    const technician = await Technician.findById(req.technicianId);
    const tasks = await Report.find({
      assignedTechId: req.technicianId,
      status: { $in: ["Assigned", "In Progress"] },
    }).select("_id reportId title location status priority priorityScore");

    const techLocation = technician.location?.latitude
      ? { latitude: technician.location.latitude, longitude: technician.location.longitude }
      : null;

    const route = optimizeRoute(techLocation, tasks);
    res.json({ success: true, route, techLocation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update technician's current location (called from app periodically)
export const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  try {
    await Technician.findByIdAndUpdate(req.technicianId, {
      "location.latitude": latitude,
      "location.longitude": longitude,
      "location.geo": { type: "Point", coordinates: [longitude, latitude] },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export async function checkAuth(req, res) {
  return res.json({ success: true, techData: req.technician });
}
