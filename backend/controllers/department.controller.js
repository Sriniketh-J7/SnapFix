import Report from "../models/report.model.js";
import Department from "../models/department.model.js";
import Technician from "../models/technician.model.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import { emitToTechnician } from "../index.js";

export async function signup(req, res) {
  try {
    const { deptName, deptHeadName, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const deptData = await Department.create({ deptName, deptHeadName, password: hashedPassword });
    res.send({ success: true, deptData });
  } catch (error) {
    res.send({ success: false, error: error.message });
  }
}

export async function loginDept(req, res) {
  try {
    const { deptHeadName, password } = req.body;
    const dept = await Department.findOne({ deptHeadName });
    if (!dept) {
      return res.status(404).json({ message: "Department not found", success: false });
    }
    const isMatch = await bcrypt.compare(password, dept.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials", success: false });
    }
    const token = generateToken({ id: dept._id, role: dept.deptName });
    res.setHeader("Authorization", `Bearer ${token}`);
    res.setHeader("Access-Control-Expose-Headers", "Authorization");
    res.json({
      success: true,
      message: "Login successful",
      dept: { id: dept._id, deptName: dept.deptName, deptHeadName: dept.deptHeadName },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", success: false });
  }
}

export async function allReports(req, res) {
  try {
    const deptId = req.deptId;
    const deptName = req.department.deptName;
    if (!deptId) {
      return res.status(404).json({ message: "not authorized", success: false });
    }

    const reports = await Report.find({ deptName })
      .select("_id reportId title location status priority assignedTechId createdAt")
      .populate("assignedTechId", "userName")
      .sort({ createdAt: -1 });

    return res.json({ success: true, reports });
  } catch (error) {
    res.json({ success: false, message: "couldn't retrieve reports", error: error.message });
  }
}

export async function SingleReport(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.json({ success: false, message: "report id to be provided" });

    const report = await Report.findById(id)
      .populate("userId", "userName")
      .populate("assignedTechId", "userName email phoneNo status");

    if (!report) return res.json({ success: false, message: "report not found" });

    if (report.deptName !== req.department.deptName) {
      return res.json({ success: false, message: "report not assigned to your department" });
    }

    return res.json({ success: true, report, message: "successfully retrieved" });
  } catch (error) {
    res.json({ success: false, message: "couldn't retrieve report", error: error.message });
  }
}

export async function assignTechnician(req, res) {
  try {
    const { technicianId, reportId } = req.params;

    if (!technicianId || !reportId) {
      return res.status(400).json({ success: false, message: "Both IDs required" });
    }

    const technician = await Technician.findById(technicianId);
    if (!technician) return res.status(404).json({ success: false, message: "Technician not found" });
    if (technician.status === "Inactive") {
      return res.status(400).json({ success: false, message: "Technician is inactive" });
    }

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    report.assignedTechId = technicianId;
    report.status = "Assigned";
    await report.save();

    // Mark technician as busy
    await Technician.findByIdAndUpdate(technicianId, { status: "Busy" });

    // Notify technician
    emitToTechnician(technicianId.toString(), "new_task_assigned", {
      reportId: report._id,
      message: `New task assigned: "${report.title}"`,
    });

    return res.json({ success: true, message: "Technician assigned", report });
  } catch (error) {
    res.status(500).json({ success: false, message: "Couldn't assign technician", error: error.message });
  }
}

export async function getAllTechnicians(req, res) {
  try {
    const deptId = req.deptId;
    const deptName = req.department.deptName;
    if (!deptId) return res.status(401).json({ success: false, message: "Not authorized" });

    const listTechs = await Technician.find({ deptName }).select("-password");
    if (!listTechs || listTechs.length === 0) {
      return res.json({ success: false, message: "No technicians found" });
    }
    return res.json({ success: true, technicians: listTechs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Couldn't retrieve technicians", error: error.message });
  }
}

export async function taskAssigned(req, res) {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    const technician = await Technician.findById(technicianId);
    if (!technician) return res.status(404).json({ success: false, message: "Technician not found" });

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      { assignedTechId: technicianId, status: "Assigned" },
      { new: true }
    ).populate("assignedTechId", "userName email phoneNo status");

    if (!updatedReport) return res.status(404).json({ success: false, message: "Report not found" });

    await Technician.findByIdAndUpdate(technicianId, { status: "Busy" });

    // Notify technician
    emitToTechnician(technicianId.toString(), "new_task_assigned", {
      reportId: updatedReport._id,
      message: `New task assigned: "${updatedReport.title}"`,
    });

    return res.json({ success: true, message: "Technician assigned successfully", report: updatedReport });
  } catch (error) {
    res.status(500).json({ success: false, message: "Couldn't assign technician", error: error.message });
  }
}

export async function newTech(req, res) {
  try {
    const { userName, password, email, phoneNo } = req.body;
    const deptName = req.department.deptName;

    if (!userName || !password || !deptName || !email || !phoneNo) {
      return res.status(400).json({ message: "Missing Fields", success: false });
    }

    const existingTechnician = await Technician.findOne({ userName });
    if (existingTechnician) {
      return res.status(400).json({ message: "Username Already Exists", success: false });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const newTechnician = new Technician({
      userName, password: hashedPass, deptName, email, phoneNo,
      performance: { avgResolutionTime: 0, rating: 0, totalResolved: 0 },
    });
    await newTechnician.save();

    const department = await Department.findOne({ deptName });
    if (department) {
      department.technicians.push(newTechnician._id);
      await department.save();
    }

    return res.status(201).json({
      message: "Technician created and added to department",
      success: true,
      technicianId: newTechnician._id,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", success: false });
  }
}

// Auto-assign all pending unassigned reports for this department
export async function autoAssignPending(req, res) {
  try {
    const deptName = req.department.deptName;
    const pendingReports = await Report.find({ deptName, status: "Pending", assignedTechId: null });
    const techs = await Technician.find({ deptName, status: { $ne: "Inactive" } });

    if (!techs.length) return res.json({ success: false, message: "No available technicians" });

    let assigned = 0;
    for (const report of pendingReports) {
      const available = techs.filter(t => t.status === "Available");
      const pool = available.length ? available : techs;
      const tech = pool[0];

      await Report.findByIdAndUpdate(report._id, { assignedTechId: tech._id, status: "Assigned" });
      await Technician.findByIdAndUpdate(tech._id, { status: "Busy" });

      emitToTechnician(tech._id.toString(), "new_task_assigned", {
        reportId: report._id,
        message: `Pending task auto-assigned: "${report.title}"`,
      });

      assigned++;
    }

    return res.json({ success: true, message: `${assigned} reports auto-assigned` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function checkAuth(req, res) {
  return res.json({ success: true, deptData: req.department });
}
