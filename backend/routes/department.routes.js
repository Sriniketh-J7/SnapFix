import express from "express";
import {
  allReports, assignTechnician, getAllTechnicians,
  SingleReport, loginDept, newTech, checkAuth, signup, taskAssigned, autoAssignPending
} from "../controllers/department.controller.js";
import { protectRoute } from "../middlewares/department.auth.js";

const deptRouter = express.Router();

deptRouter.post("/signup", signup);
deptRouter.post("/loginDept", loginDept);
deptRouter.get("/allreports", protectRoute, allReports);
deptRouter.get("/singleReport/:id", protectRoute, SingleReport);
deptRouter.patch("/assignTechnician/:reportId/:technicianId", protectRoute, assignTechnician);
deptRouter.get("/allTechnicians", protectRoute, getAllTechnicians);
deptRouter.get("/checkAuth", protectRoute, checkAuth);
deptRouter.post("/assignTechnician/:id/assign", protectRoute, taskAssigned);
deptRouter.post("/createTechnician", protectRoute, newTech);   // Fixed: POST not GET
deptRouter.post("/autoAssign", protectRoute, autoAssignPending);

export default deptRouter;
