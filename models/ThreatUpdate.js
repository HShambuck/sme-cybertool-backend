// models/ThreatUpdate.js
const mongoose = require("mongoose");

const threatUpdateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ["info", "low", "warning", "high", "critical"],
    required: true,
    default: "info"
  },
  category: {
    type: String,
    enum: [
      "phishing",
      "ransomware",
      "vulnerability",
      "malware",
      "data_breach",
      "policy",
      "general",
    ],
    default: "general"
  },
  source: String,
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  affectedRegions: [String],
  recommendations: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ThreatUpdate", threatUpdateSchema);
