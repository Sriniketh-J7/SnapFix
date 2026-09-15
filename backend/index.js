import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

import userRoutes from "./routes/user.routes.js";
import reportRoutes from "./routes/report.routes.js";
import technicianRoutes from "./routes/technician.routes.js";
import deptRouter from "./routes/department.routes.js";

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

const userSockets = new Map();
const techSockets = new Map();

io.on("connection", (socket) => {
  socket.on("register_user", (userId) => {
    userSockets.set(userId, socket.id);
  });
  socket.on("register_technician", (techId) => {
    techSockets.set(techId, socket.id);
  });
  // Dept heads join a room so escalation broadcasts reach them
  socket.on("register_dept", (deptName) => {
    socket.join(`dept:${deptName}`);
  });
  socket.on("disconnect", () => {
    for (const [k, v] of userSockets.entries()) if (v === socket.id) userSockets.delete(k);
    for (const [k, v] of techSockets.entries()) if (v === socket.id) techSockets.delete(k);
  });
});

export function emitToUser(userId, event, data) {
  const sid = userSockets.get(userId?.toString());
  if (sid) io.to(sid).emit(event, data);
}
export function emitToTechnician(techId, event, data) {
  const sid = techSockets.get(techId?.toString());
  if (sid) io.to(sid).emit(event, data);
}

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  exposedHeaders: ["Authorization"],
  credentials: true,
}));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URL)
  .then(async () => {
    console.log("MongoDB Connected");
    // Start escalation cron after DB is ready
    const { runEscalationCheck } = await import("./utils/Escalation.js");
    runEscalationCheck(); // run once on startup
    setInterval(runEscalationCheck, 60 * 60 * 1000); // then every hour
  })
  .catch((err) => console.log("MongoDB Connection Failed", err));

app.use("/api/user", userRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/technician", technicianRoutes);
app.use("/api/department", deptRouter);

app.get("/", (req, res) => res.send("SnapFix API running"));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
