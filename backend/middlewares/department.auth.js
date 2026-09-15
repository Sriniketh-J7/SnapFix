import jwt from "jsonwebtoken";
import Department from "../models/department.model.js";

export const protectRoute = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided", success: false });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const department = await Department.findById(decoded.id).select("-password");
    if (!department) return res.status(401).json({ message: "Department not found", success: false });
    req.deptId = department._id;
    req.department = department;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token", success: false });
  }
};
