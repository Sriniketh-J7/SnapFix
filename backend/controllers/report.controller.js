import Report from "../models/report.model.js";
import Technician from "../models/technician.model.js";
import { getDepartmentAndPriority } from "../utils/Priority.js";
import { assignBestTechnician } from "../utils/Assignment.js";

export const createReport = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user._id;

    const location = typeof req.body.location === "string"
      ? JSON.parse(req.body.location) : req.body.location;

    const { priority, deptName, priorityScore } = getDepartmentAndPriority(title, 0, new Date());

    const reportCount = await Report.countDocuments({ deptName });
    const newReportId = `RPT-${String(reportCount + 1).padStart(3, "0")}`;

    const newReport = new Report({
      reportId: newReportId,
      userId,
      title,
      description,
      imageUrl: req.files?.image ? req.files.image[0].path : undefined,
      location,
      priority,
      priorityScore,
      deptName,
    });

    await newReport.save(); // pre-save hook sets location.geo

    // Geo-nearest + workload-balanced assignment
    await assignBestTechnician(newReport);
    const savedReport = await Report.findById(newReport._id);

    res.json({ success: true, message: "Report created successfully", report: savedReport });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong", success: false });
  }
};

// User's own reports
export const allReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const reportDetails = await Report.find({ userId })
      .select("_id reportId title location status priority priorityScore upvotes createdAt")
      .sort({ createdAt: -1 });
    return res.json({ success: true, reportDetails });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong", success: false });
  }
};

// All city reports (public - no auth required, or optional auth for upvote status)
export const cityReports = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in km, default 10km

    let query = { status: { $ne: "Resolved" } };
    let mongoQuery;

    if (lat && lng) {
      // Geo query: find within radius km
      mongoQuery = Report.find({
        ...query,
        "location.geo": {
          $near: {
            $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseFloat(radius) * 1000, // metres
          },
        },
      });
    } else {
      mongoQuery = Report.find(query);
    }

    const reports = await mongoQuery
      .select("_id reportId title location status priority priorityScore upvotes deptName createdAt imageUrl")
      .sort({ priorityScore: -1 })
      .limit(200);

    return res.json({ success: true, reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong", success: false });
  }
};

// Heatmap data: cluster of geo points for density rendering
export const heatmapData = async (req, res) => {
  try {
    const reports = await Report.find({
      "location.latitude": { $exists: true },
      "location.longitude": { $exists: true },
    }).select("location.latitude location.longitude priority priorityScore deptName");

    const points = reports.map(r => ({
      lat: r.location.latitude,
      lng: r.location.longitude,
      weight: r.priorityScore || 1,
    }));

    return res.json({ success: true, points });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Upvote a report
export const upvoteReport = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    const alreadyVoted = report.upvotedBy.some(uid => uid.toString() === userId.toString());
    if (alreadyVoted) {
      // Toggle off
      report.upvotes = Math.max(0, report.upvotes - 1);
      report.upvotedBy = report.upvotedBy.filter(uid => uid.toString() !== userId.toString());
    } else {
      report.upvotes += 1;
      report.upvotedBy.push(userId);
    }

    // Recalc priority after upvote
    const { priority, priorityScore } = getDepartmentAndPriority(report.title, report.upvotes, report.createdAt);
    report.priority = priority;
    report.priorityScore = priorityScore;

    await report.save();
    return res.json({ success: true, upvotes: report.upvotes, priority: report.priority, voted: !alreadyVoted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const singleReport = async (req, res) => {
  const id = req.params.id;
  try {
    const report = await Report.findById(id)
      .populate("assignedTechId", "userName email phoneNo status")
      .populate("userId", "userName");
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    return res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
};

export const submitFeedback = async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;
  const userId = req.user._id;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    if (report.userId.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });
    report.feedback = feedback;
    await report.save();
    return res.json({ success: true, message: "Feedback submitted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
