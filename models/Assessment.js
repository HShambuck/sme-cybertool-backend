// models/Assessment.js
const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Added index for faster user queries
    },
    assessmentDate: {
      type: Date,
      default: Date.now,
      index: true, // Added index for sorting by date
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    level: {
      type: String,
      enum: ["LOW RISK", "MEDIUM RISK", "HIGH RISK", "CRITICAL RISK"],
      required: true,
    },
    questionsAnswered: [
      {
        questionId: {
          type: String,
          required: true,
        },
        question: {
          type: String, // Optional: store the actual question text
        },
        answer: {
          type: mongoose.Schema.Types.Mixed, // Can be string, number, boolean
          required: true,
        },
        scoreImpact: {
          type: Number,
          required: true,
          min: 0,
          max: 5,
        },
      },
    ],
    recommendationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recommendation",
      },
    ],
    detailedReportLink: {
      type: String,
    },
    status: {
      type: String,
      enum: ["completed", "pending", "reassessment_needed"],
      default: "completed",
    },
    explanation: {
      type: String,
      // AI-generated explanation of the risk assessment
    },
    scoringMethod: {
      type: String,
      enum: ["ai", "manual"],
      default: "ai",
      // Track whether AI or manual scoring was used
    },
    aiModel: {
      type: String,
      // Track which AI model was used (e.g., "llama-3.3-8b-instruct")
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);

// Indexes for common queries
assessmentSchema.index({ userId: 1, assessmentDate: -1 });
assessmentSchema.index({ level: 1 });
assessmentSchema.index({ status: 1 });

// Virtual for calculating time since assessment
assessmentSchema.virtual("daysSinceAssessment").get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.assessmentDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for calculating weeks since assessment
assessmentSchema.virtual("weeksSinceAssessment").get(function () {
  const days = this.daysSinceAssessment;
  return Math.floor(days / 7);
});

// Method to check if reassessment is needed (e.g., after 3 months)
assessmentSchema.methods.needsReassessment = function () {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return this.assessmentDate < threeMonthsAgo;
};

// Static method to get user's assessment history
assessmentSchema.statics.getUserHistory = function (userId) {
  return this.find({ userId })
    .sort({ assessmentDate: -1 })
    .populate("recommendationIds")
    .exec();
};

// Static method to get average score for all users (for dashboard stats)
assessmentSchema.statics.getAverageScore = async function () {
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        avgScore: { $avg: "$score" },
      },
    },
  ]);
  return result[0]?.avgScore || 0;
};

// Ensure virtuals are included when converting to JSON
assessmentSchema.set("toJSON", { virtuals: true });
assessmentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Assessment", assessmentSchema);
