// models/TrainingProgress.js
const mongoose = require("mongoose");

const trainingProgressSchema = new mongoose.Schema(
  {
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
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0,
    },
    completedSteps: [
      {
        stepNumber: Number,
        completedAt: Date,
      },
    ],
    checklistProgress: [
      {
        itemIndex: Number,
        completed: Boolean,
        completedAt: Date,
      },
    ],
    quizAttempts: [
      {
        attemptNumber: Number,
        score: Number,
        passed: Boolean,
        answers: [
          {
            questionIndex: Number,
            selectedAnswer: Number,
            correct: Boolean,
          },
        ],
        attemptedAt: Date,
      },
    ],
    bestQuizScore: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    feedback: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    relatedAssessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for faster queries
trainingProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });
trainingProgressSchema.index({ userId: 1, status: 1 });
trainingProgressSchema.index({ moduleId: 1 });

// Method to mark step as completed
trainingProgressSchema.methods.completeStep = function (stepNumber) {
  const existingStep = this.completedSteps.find(
    (s) => s.stepNumber === stepNumber
  );
  if (!existingStep) {
    this.completedSteps.push({
      stepNumber,
      completedAt: new Date(),
    });
  }
  return this.save();
};

// Method to update progress percentage
trainingProgressSchema.methods.updateProgress = function (totalSteps) {
  if (totalSteps > 0) {
    this.progress = Math.round((this.completedSteps.length / totalSteps) * 100);
  }
  return this.save();
};

// Method to complete module
trainingProgressSchema.methods.complete = function () {
  this.status = "completed";
  this.progress = 100;
  this.completedAt = new Date();
  return this.save();
};

// Static method to get user's overall training stats
trainingProgressSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgProgress: { $avg: "$progress" },
        totalTimeSpent: { $sum: "$timeSpent" },
      },
    },
  ]);

  const result = {
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    averageProgress: 0,
    totalTimeSpent: 0,
  };

  stats.forEach((stat) => {
    result.total += stat.count;
    result.totalTimeSpent += stat.totalTimeSpent || 0;
    if (stat._id === "completed") {
      result.completed = stat.count;
    } else if (stat._id === "in_progress") {
      result.inProgress = stat.count;
      result.averageProgress = stat.avgProgress || 0;
    } else if (stat._id === "not_started") {
      result.notStarted = stat.count;
    }
  });

  return result;
};

module.exports = mongoose.model("TrainingProgress", trainingProgressSchema);
