import jwt from "jsonwebtoken";
import Technician from "../models/technician.model.js";

const authTechnician = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided", success: false });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const technician = await Technician.findById(decoded.id).select("-password");
    if (!technician) return res.status(401).json({ message: "Technician not found", success: false });
    req.technicianId = technician._id;
    req.technician = technician;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token", success: false });
  }
};

export default authTechnician;
