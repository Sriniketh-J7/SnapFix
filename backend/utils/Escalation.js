import Report from "../models/report.model.js";
import { recalcPriority } from "./Priority.js";
import { io } from "../index.js";

const ESCALATION_HOURS = 14;

/**
 * Run every hour via setInterval in index.js.
 * - Escalates any Assigned/In Progress report not resolved in 14 hours
 * - Also recalculates priority scores for all pending reports (age factor)
 */
export async function runEscalationCheck() {
  const cutoff = new Date(Date.now() - ESCALATION_HOURS * 3_600_000);

  try {
    // Find active reports older than 14h that aren't yet escalated
    const toEscalate = await Report.find({
      status: { $in: ["Assigned", "In Progress"] },
      escalated: { $ne: true },
      createdAt: { $lt: cutoff },
    });

    for (const report of toEscalate) {
      report.escalated = true;
      report.escalatedAt = new Date();
      report.status = "Escalated";
      // Force Critical priority on escalation
      report.priority = "Critical";
      report.priorityScore = 100;
      await report.save();

      // Broadcast to all dept heads via socket room (they join "dept:<name>")
      io.to(`dept:${report.deptName}`).emit("report_escalated", {
        reportId: report._id,
        reportRef: report.reportId,
        title: report.title,
        message: `ESCALATED: "${report.title}" unresolved for ${ESCALATION_HOURS}+ hours.`,
      });

    }

    // Recalc priority scores for all Pending/Assigned reports (age increases score over time)
    const active = await Report.find({
      status: { $in: ["Pending", "Assigned"] },
      escalated: { $ne: true },
    });

    for (const report of active) {
      const { priority, priorityScore } = recalcPriority(report);
      if (report.priority !== priority || report.priorityScore !== priorityScore) {
        await Report.findByIdAndUpdate(report._id, { priority, priorityScore });
      }
    }

    if (toEscalate.length > 0) {
      console.log(`Escalation check: ${toEscalate.length} escalated, ${active.length} priority scores refreshed`);
    }
  } catch (err) {
    console.error("Escalation check error:", err.message);
  }
}
