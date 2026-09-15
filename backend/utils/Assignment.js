import Technician from "../models/technician.model.js";
import Report from "../models/report.model.js";
import { emitToTechnician } from "../index.js";

/**
 * Haversine distance in km between two [lng, lat] points
 */
function haversine([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Priority Queue (min-heap by priorityScore DESC)
 */
class PriorityQueue {
  constructor() { this.heap = []; }
  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }
  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) { this.heap[0] = last; this._sinkDown(0); }
    return top;
  }
  get size() { return this.heap.length; }
  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].priorityScore >= this.heap[i].priorityScore) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }
  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let largest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].priorityScore > this.heap[largest].priorityScore) largest = l;
      if (r < n && this.heap[r].priorityScore > this.heap[largest].priorityScore) largest = r;
      if (largest === i) break;
      [this.heap[largest], this.heap[i]] = [this.heap[i], this.heap[largest]];
      i = largest;
    }
  }
}

/**
 * Assign best technician to a report.
 * Selection criteria (in order):
 *   1. Same department (required)
 *   2. Not Inactive
 *   3. Workload score = activeTaskCount * 10 + (Busy ? 5 : 0)
 *   4. If report has geo coords: prefer closer technician (distance score)
 *   5. Final score = workloadScore + distanceScore (lower is better)
 */
export async function assignBestTechnician(report) {
  try {
    const techs = await Technician.find({
      deptName: report.deptName,
      status: { $ne: "Inactive" },
    });

    if (!techs.length) return null;

    const reportCoords = report.location?.geo?.coordinates; // [lng, lat]

    // Score each technician (lower = better candidate)
    const scored = techs.map((t) => {
      const workloadScore = (t.performance?.activeTaskCount || 0) * 10 + (t.status === "Busy" ? 5 : 0);

      let distanceScore = 0;
      if (reportCoords && t.location?.geo?.coordinates) {
        const dist = haversine(reportCoords, t.location.geo.coordinates);
        distanceScore = Math.min(dist * 2, 50); // km * 2, cap at 50
      }

      return { tech: t, score: workloadScore + distanceScore };
    });

    scored.sort((a, b) => a.score - b.score);
    const chosen = scored[0].tech;

    // Update report
    await Report.findByIdAndUpdate(report._id, {
      assignedTechId: chosen._id,
      status: "Assigned",
    });

    // Update technician workload
    await Technician.findByIdAndUpdate(chosen._id, {
      status: "Busy",
      $inc: { "performance.activeTaskCount": 1 },
    });

    emitToTechnician(chosen._id.toString(), "new_task_assigned", {
      reportId: report._id,
      message: `New ${report.priority} priority task: "${report.title}"`,
    });

    return chosen._id;
  } catch (err) {
    console.error("Assignment error:", err.message);
    return null;
  }
}

/**
 * TSP nearest-neighbour route for a technician's active tasks.
 * Returns ordered array of reports starting from technician's current location.
 */
export function optimizeRoute(techLocation, reports) {
  if (!reports.length) return [];
  if (!techLocation) return reports; // no location, return as-is

  const start = [techLocation.longitude, techLocation.latitude];
  const unvisited = [...reports];
  const route = [];
  let current = start;

  while (unvisited.length) {
    let nearest = null;
    let nearestDist = Infinity;
    let nearestIdx = -1;

    for (let i = 0; i < unvisited.length; i++) {
      const r = unvisited[i];
      if (!r.location?.longitude || !r.location?.latitude) {
        // No coords - push to end
        continue;
      }
      const dist = haversine(current, [r.location.longitude, r.location.latitude]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = r;
        nearestIdx = i;
      }
    }

    if (nearest) {
      route.push({ ...nearest.toObject ? nearest.toObject() : nearest, _distFromPrev: nearestDist });
      current = [nearest.location.longitude, nearest.location.latitude];
      unvisited.splice(nearestIdx, 1);
    } else {
      // remaining reports have no coords - append them
      route.push(...unvisited.splice(0));
    }
  }

  return route;
}

export { PriorityQueue };
