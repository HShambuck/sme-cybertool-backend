// models/WebsiteScan.js
const mongoose = require("mongoose");

const websiteScanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    sslGrade: {
      type: String,
      required: true,
      default: "N/A",
    },
    securityHeaders: {
      type: [String],
      default: [],
    },
    issues: {
      type: [String],
      default: [],
    },
    reputation: {
      type: String,
      enum: ["Clean", "Warning", "Unknown"],
      default: "Unknown",
    },
    breachStatus: {
      type: String,
      default: "Unable to verify",
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    recommendations: {
      type: [
        {
          priority: {
            type: String,
            enum: ["critical", "high", "medium", "low"],
            required: true,
          },
          category: {
            type: String,
            required: true,
          },
          title: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            required: true,
          },
          action: {
            type: String,
            required: true,
          },
          impact: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
    },
    recommendationMethod: {
      type: String,
      enum: ["ai", "hardcoded"],
      default: "hardcoded",
    },
    scanDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
websiteScanSchema.index({ userId: 1, scanDate: -1 });
websiteScanSchema.index({ domain: 1 });

module.exports = mongoose.model("WebsiteScan", websiteScanSchema);
