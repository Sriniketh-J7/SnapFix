import express from "express";
import {
  allReports, createReport, singleReport,
  submitFeedback, cityReports, upvoteReport, heatmapData
} from "../controllers/report.controller.js";
import auth from "../middlewares/auth.js";
import { uploadreport } from "../middlewares/uploadreport.js";

const router = express.Router();

router.post("/create", auth, uploadreport, createReport);
router.get("/myReports", auth, allReports);
router.get("/singleReport/:id", singleReport);       // no auth - public view
router.post("/feedback/:id", auth, submitFeedback);
router.get("/city", cityReports);                     // public - all city reports
router.get("/heatmap", heatmapData);                  // public - heatmap points
router.post("/upvote/:id", auth, upvoteReport);       // auth required to upvote

export default router;
