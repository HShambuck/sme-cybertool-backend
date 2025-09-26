// models/TrainingModule.js
const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: Number,
});

const trainingModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  durationMinutes: {
    type: Number,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  content: String,
  quiz: [quizSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TrainingModule", trainingModuleSchema);
