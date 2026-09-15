import express from "express";
import { login, signup, checkAuth } from "../controllers/user.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/checkAuth", auth, checkAuth);

export default router;
