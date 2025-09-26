// models/TrainingProgress.js
const mongoose = require("mongoose");

const trainingProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainingModule",
    required: true,
  },
  status: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "not_started",
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
  },
  startedAt: Date,
  completedAt: Date,
  timeSpentMinutes: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Composite index to prevent duplicate progress records
trainingProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

module.exports = mongoose.model("TrainingProgress", trainingProgressSchema);
