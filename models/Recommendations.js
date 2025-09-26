// models/Recommendation.js
const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    required: true,
  },
  relatedTrainingModuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainingModule",
  },
  videoUrl: {
    type: String, // URL to the training video
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "dismissed"],
    default: "pending",
  },
  category: {
    type: String,
    enum: [
      "training",
      "security_measure",
      "data_protection",
      "policy",
      "technical",
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Recommendation", recommendationSchema);
