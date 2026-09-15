import express from "express";
import authTechnician from "../middlewares/authTechnician.js";
import {
  alltasks, startTask, resolveTask, logintech,
  singletask, checkAuth, signup, getOptimizedRoute, updateLocation
} from "../controllers/technician.controller.js";
import { memoryUpload, uploadBufferToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

const uploadResolution = (req, res, next) => {
  memoryUpload.single("photo")(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return next();
    try {
      const result = await uploadBufferToCloudinary(req.file.buffer, "snapfix/resolutions");
      req.file.path = result.secure_url;
      next();
    } catch (e) {
      res.status(500).json({ success: false, message: "Upload failed: " + e.message });
    }
  });
};

router.post("/signup", signup);
router.post("/login", logintech);
router.get("/alltasks", authTechnician, alltasks);
router.get("/task/:id", authTechnician, singletask);
router.patch("/task/:id/start", authTechnician, startTask);
router.patch("/task/:id/resolve", authTechnician, uploadResolution, resolveTask);
router.get("/route", authTechnician, getOptimizedRoute);
router.post("/location", authTechnician, updateLocation);
router.get("/checkAuth", authTechnician, checkAuth);

export default router;
