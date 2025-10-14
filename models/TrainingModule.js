// models/TrainingModule.js
const mongoose = require("mongoose");

const trainingModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
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
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    estimatedDuration: {
      type: Number, // in minutes
      required: true,
    },
    content: {
      overview: {
        type: String,
        required: true,
      },
      learningObjectives: [
        {
          type: String,
        },
      ],
      steps: [
        {
          stepNumber: Number,
          title: String,
          description: String,
          resources: [
            {
              type: { type: String },
              url: String,
            },
          ],
        },
      ],
      checklistItems: [
        {
          item: String,
          completed: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    videoUrl: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    resources: [
      {
        title: String,
        type: {
          type: String,
          enum: ["video", "article", "pdf", "tool", "checklist"],
        },
        url: String,
        description: String,
      },
    ],
    relatedRecommendations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recommendation",
      },
    ],
    quiz: {
      questions: [
        {
          question: String,
          options: [String],
          correctAnswer: Number, // index of correct option
          explanation: String,
        },
      ],
      passingScore: {
        type: Number,
        default: 70, // percentage
      },
    },
    tags: [String],
    isPublished: {
      type: Boolean,
      default: true,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
trainingModuleSchema.index({ category: 1 });
trainingModuleSchema.index({ difficulty: 1 });
trainingModuleSchema.index({ isPublished: 1 });
trainingModuleSchema.index({ tags: 1 });

// Virtual for calculating completion rate
trainingModuleSchema.virtual("completionRate").get(function () {
  if (!this.content.checklistItems || this.content.checklistItems.length === 0)
    return 0;
  const completed = this.content.checklistItems.filter(
    (i) => i.completed
  ).length;
  return Math.round((completed / this.content.checklistItems.length) * 100);
});

// Ensure virtuals are included in JSON
trainingModuleSchema.set("toJSON", { virtuals: true });
trainingModuleSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("TrainingModule", trainingModuleSchema);
