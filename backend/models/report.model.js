import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportId: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTechId: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", default: null },
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  resolvedImageUrl: { type: String },

  // GeoJSON for $near queries and 2dsphere index
  location: {
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    // GeoJSON point for MongoDB geo queries
    geo: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
    },
  },

  status: {
    type: String,
    enum: ["Pending", "Assigned", "In Progress", "Resolved", "Escalated"],
    default: "Pending",
  },

  // Computed priority score (0-100). Higher = more urgent.
  priorityScore: { type: Number, default: 0 },
  priority: { type: String, enum: ["Critical", "High", "Medium", "Low"], default: "Low" },
  deptName: { type: String },

  // Upvoting
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Escalation
  escalated: { type: Boolean, default: false },
  escalatedAt: { type: Date },

  startedAt: { type: Date },
  resolvedTime: { type: Date },
  feedback: { type: String },
}, { timestamps: true });

// 2dsphere index for geo queries
reportSchema.index({ "location.geo": "2dsphere" });

// Pre-save: sync GeoJSON from lat/lng
reportSchema.pre("save", function (next) {
  if (this.location?.latitude && this.location?.longitude) {
    this.location.geo = {
      type: "Point",
      coordinates: [this.location.longitude, this.location.latitude],
    };
  }
  next();
});

const Report = mongoose.model("Report", reportSchema);
export default Report;
