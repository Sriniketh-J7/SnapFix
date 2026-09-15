import mongoose from "mongoose";

const technicianSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phoneNo: { type: String },
  deptName: { type: String, required: true },
  status: { type: String, enum: ["Available", "Busy", "Inactive"], default: "Available" },

  // Current location for geo-based assignment
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    geo: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
    },
  },

  performance: {
    avgResolutionTime: { type: Number, default: 0 }, // minutes
    rating: { type: Number, default: 0 },
    totalResolved: { type: Number, default: 0 },
    activeTaskCount: { type: Number, default: 0 }, // for workload balancing
  },
}, { timestamps: true });

technicianSchema.index({ "location.geo": "2dsphere" });

const Technician = mongoose.model("Technician", technicianSchema);
export default Technician;
