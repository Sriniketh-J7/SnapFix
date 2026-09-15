/**
 * PRIORITY ENGINE
 * Score = baseScore + upvoteScore + ageScore
 * Score ranges 0-100. Critical > 75, High 50-75, Medium 25-50, Low <25
 *
 * Factors:
 *   a) Issue type base score (flooding/electricity always high)
 *   b) Upvotes (community weight)
 *   c) Age of report (older = more urgent if unsolved)
 */

// Base scores by issue type (0-100)
const ISSUE_BASE = {
  // Critical public safety
  "power outage":             { deptName: "Electrical",    baseScore: 90 },
  "broken traffic signal":    { deptName: "Electrical",    baseScore: 85 },
  "animal attack":            { deptName: "Animal Control",baseScore: 85 },
  "blocked drain":            { deptName: "Sanitation",    baseScore: 80 },
  "water leakage":            { deptName: "Water",         baseScore: 78 },
  "broken water pipe":        { deptName: "Water",         baseScore: 75 },
  // Medium
  "street light not working": { deptName: "Electrical",    baseScore: 55 },
  "garbage not collected":    { deptName: "Sanitation",    baseScore: 50 },
  "road damage":              { deptName: "Civil",         baseScore: 48 },
  "pothole":                  { deptName: "Civil",         baseScore: 45 },
  // Low
  "damaged footpath":         { deptName: "Civil",         baseScore: 25 },
  "stray animals":            { deptName: "Animal Control",baseScore: 20 },
};

function scoreToLabel(score) {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

/**
 * Calculate priority score for a new report.
 * upvotes defaults to 0 on creation.
 */
export function getDepartmentAndPriority(title, upvotes = 0, createdAt = new Date()) {
  const key = Object.keys(ISSUE_BASE).find(
    (k) => k.toLowerCase() === title?.toLowerCase().trim()
  );

  const { deptName = "Civil", baseScore = 20 } = ISSUE_BASE[key] || {};

  // Upvote contribution: log scale, max +20
  const upvoteScore = Math.min(Math.round(Math.log1p(upvotes) * 5), 20);

  // Age contribution: +1 per hour since report, max +10
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  const ageScore = Math.min(Math.round(hoursOld), 10);

  const totalScore = Math.min(baseScore + upvoteScore + ageScore, 100);
  const priority = scoreToLabel(totalScore);

  return { deptName, priority, priorityScore: totalScore };
}

/**
 * Recalculate priority for an existing report (after upvote or time check).
 */
export function recalcPriority(report) {
  return getDepartmentAndPriority(
    report.title,
    report.upvotes || 0,
    report.createdAt
  );
}

export const PRIORITY_SCORE = { Critical: 4, High: 3, Medium: 2, Low: 1 };
