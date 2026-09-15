import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  deptName: { type: String, required: true, unique: true },
  deptHeadName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  technicians: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technician" }],
}, { timestamps: true });

const Department = mongoose.model("Department", departmentSchema);
export default Department;
