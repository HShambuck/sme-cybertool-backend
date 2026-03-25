// models/Recommendations.js
const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  text: { type: String, required: true },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    required: true,
  },
  relatedTrainingModuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainingModule",
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "dismissed"],
    default: "pending",
  },
  category: {
    type: String,
    enum: [
      "security_measure",
      "data_protection",
      "technical",
      "training",
      "policy",
      "physical_security",
      "device_security",
      "vendor",
    ],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

recommendationSchema.index({ assessmentId: 1, status: 1 });
recommendationSchema.index({ userId: 1, status: 1 });
recommendationSchema.index({ category: 1 });

module.exports = mongoose.model("Recommendation", recommendationSchema);
