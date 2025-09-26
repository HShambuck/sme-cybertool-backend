const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assessmentDate: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      required: true,
    },
    level: {
      type: String,
      enum: ["LOW RISK", "MEDIUM RISK", "HIGH RISK", "CRITICAL RISK"],
      required: true,
    },
    questionsAnswered: [
      {
        // You might want a separate Question model here too
        questionId: String, // Or ObjectId if you make a Question model
        answer: mongoose.Schema.Types.Mixed, // Can be string, number, boolean
        scoreImpact: Number,
      },
    ],
    recommendationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recommendation",
      },
    ],
    detailedReportLink: String,
    status: {
      type: String,
      enum: ["completed", "pending", "reassessment_needed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assessment", assessmentSchema);
