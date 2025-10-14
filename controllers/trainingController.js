// controllers/trainingController.js
const asyncHandler = require("express-async-handler");
const TrainingModule = require("../models/TrainingModule");
const TrainingProgress = require("../models/TrainingProgress");
const Recommendation = require("../models/Recommendations");

// @desc    Get all training modules
// @route   GET /api/training
// @access  Private
const getAllModules = asyncHandler(async (req, res) => {
  const { category, difficulty, search } = req.query;

  let query = { isPublished: true };

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by difficulty
  if (difficulty) {
    query.difficulty = difficulty;
  }

  // Search by title or tags
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  const modules = await TrainingModule.find(query)
    .select("-quiz") // Don't send quiz questions in list view
    .sort({ createdAt: -1 });

  // Get user's progress for each module
  const modulesWithProgress = await Promise.all(
    modules.map(async (module) => {
      const progress = await TrainingProgress.findOne({
        userId: req.user._id,
        moduleId: module._id,
      });

      return {
        ...module.toJSON(),
        userProgress: progress
          ? {
              status: progress.status,
              progress: progress.progress,
              startedAt: progress.startedAt,
              completedAt: progress.completedAt,
            }
          : {
              status: "not_started",
              progress: 0,
            },
      };
    })
  );

  res.status(200).json(modulesWithProgress);
});

// @desc    Get single training module by ID
// @route   GET /api/training/:id
// @access  Private
const getModuleById = asyncHandler(async (req, res) => {
  const module = await TrainingModule.findById(req.params.id);

  if (!module) {
    res.status(404);
    throw new Error("Training module not found");
  }

  // Get user's progress
  let progress = await TrainingProgress.findOne({
    userId: req.user._id,
    moduleId: module._id,
  });

  // If no progress exists, create one
  if (!progress) {
    progress = await TrainingProgress.create({
      userId: req.user._id,
      moduleId: module._id,
      status: "not_started",
    });
  }

  res.status(200).json({
    module,
    progress,
  });
});

// @desc    Get modules by category
// @route   GET /api/training/category/:category
// @access  Private
const getModulesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const modules = await TrainingModule.find({
    category,
    isPublished: true,
  }).select("-quiz");

  res.status(200).json(modules);
});

// @desc    Get recommended modules for user based on assessment
// @route   GET /api/training/recommended
// @access  Private
const getRecommendedModules = asyncHandler(async (req, res) => {
  // Get user's latest assessment recommendations
  const recommendations = await Recommendation.find({
    userId: req.user._id,
    status: { $ne: "completed" },
  })
    .populate("relatedTrainingModuleId")
    .limit(10);

  // Extract unique categories from recommendations
  const categories = [...new Set(recommendations.map((r) => r.category))];

  // Get modules matching these categories
  const modules = await TrainingModule.find({
    category: { $in: categories },
    isPublished: true,
  })
    .select("-quiz")
    .limit(20);

  // Get user's progress for these modules
  const modulesWithProgress = await Promise.all(
    modules.map(async (module) => {
      const progress = await TrainingProgress.findOne({
        userId: req.user._id,
        moduleId: module._id,
      });

      return {
        ...module.toJSON(),
        userProgress: progress
          ? {
              status: progress.status,
              progress: progress.progress,
            }
          : {
              status: "not_started",
              progress: 0,
            },
      };
    })
  );

  res.status(200).json(modulesWithProgress);
});

// @desc    Start a training module
// @route   POST /api/training/:id/start
// @access  Private
const startModule = asyncHandler(async (req, res) => {
  const module = await TrainingModule.findById(req.params.id);

  if (!module) {
    res.status(404);
    throw new Error("Training module not found");
  }

  // Find or create progress
  let progress = await TrainingProgress.findOne({
    userId: req.user._id,
    moduleId: module._id,
  });

  if (!progress) {
    progress = await TrainingProgress.create({
      userId: req.user._id,
      moduleId: module._id,
      status: "in_progress",
      startedAt: new Date(),
    });
  } else if (progress.status === "not_started") {
    progress.status = "in_progress";
    progress.startedAt = new Date();
    await progress.save();
  }

  res.status(200).json(progress);
});

// @desc    Update module progress (complete step)
// @route   PUT /api/training/:id/progress
// @access  Private
const updateProgress = asyncHandler(async (req, res) => {
  const { stepNumber, checklistItems, timeSpent } = req.body;

  let progress = await TrainingProgress.findOne({
    userId: req.user._id,
    moduleId: req.params.id,
  });

  if (!progress) {
    res.status(404);
    throw new Error("Progress not found. Start the module first.");
  }

  // Update completed steps
  if (stepNumber !== undefined) {
    await progress.completeStep(stepNumber);
  }

  // Update checklist progress
  if (checklistItems) {
    progress.checklistProgress = checklistItems;
  }

  // Update time spent
  if (timeSpent) {
    progress.timeSpent += timeSpent;
  }

  // Get module to calculate total steps
  const module = await TrainingModule.findById(req.params.id);
  if (module && module.content.steps) {
    await progress.updateProgress(module.content.steps.length);
  }

  await progress.save();

  res.status(200).json(progress);
});

// @desc    Complete a training module
// @route   POST /api/training/:id/complete
// @access  Private
const completeModule = asyncHandler(async (req, res) => {
  const module = await TrainingModule.findById(req.params.id);

  if (!module) {
    res.status(404);
    throw new Error("Training module not found");
  }

  let progress = await TrainingProgress.findOne({
    userId: req.user._id,
    moduleId: module._id,
  });

  if (!progress) {
    res.status(404);
    throw new Error("Progress not found");
  }

  await progress.complete();

  // Increment module completion count
  module.completionCount += 1;
  await module.save();

  res.status(200).json({
    message: "Module completed successfully",
    progress,
  });
});

// @desc    Submit quiz attempt
// @route   POST /api/training/:id/quiz
// @access  Private
const submitQuiz = asyncHandler(async (req, res) => {
  const { answers } = req.body; // Array of selected answer indices

  const module = await TrainingModule.findById(req.params.id);

  if (!module || !module.quiz || !module.quiz.questions) {
    res.status(404);
    throw new Error("Quiz not found for this module");
  }

  let progress = await TrainingProgress.findOne({
    userId: req.user._id,
    moduleId: module._id,
  });

  if (!progress) {
    res.status(404);
    throw new Error("Progress not found. Start the module first.");
  }

  // Grade the quiz
  const questions = module.quiz.questions;
  let correctCount = 0;
  const gradedAnswers = answers.map((selectedAnswer, index) => {
    const correct = selectedAnswer === questions[index].correctAnswer;
    if (correct) correctCount++;
    return {
      questionIndex: index,
      selectedAnswer,
      correct,
    };
  });

  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= (module.quiz.passingScore || 70);

  // Save quiz attempt
  const attempt = {
    attemptNumber: progress.quizAttempts.length + 1,
    score,
    passed,
    answers: gradedAnswers,
    attemptedAt: new Date(),
  };

  progress.quizAttempts.push(attempt);

  // Update best score
  if (score > progress.bestQuizScore) {
    progress.bestQuizScore = score;
  }

  // If passed and module not completed, mark as completed
  if (passed && progress.status !== "completed") {
    await progress.complete();
    module.completionCount += 1;
    await module.save();
  }

  await progress.save();

  res.status(200).json({
    score,
    passed,
    correctCount,
    totalQuestions: questions.length,
    gradedAnswers,
    passingScore: module.quiz.passingScore || 70,
  });
});

// @desc    Rate a training module
// @route   POST /api/training/:id/rate
// @access  Private
const rateModule = asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;

  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  const module = await TrainingModule.findById(req.params.id);

  if (!module) {
    res.status(404);
    throw new Error("Training module not found");
  }

  let progress = await TrainingProgress.findOne({
    userId: req.user._id,
    moduleId: module._id,
  });

  if (!progress) {
    res.status(404);
    throw new Error("You must complete the module before rating it");
  }

  progress.rating = rating;
  progress.feedback = feedback || null;
  await progress.save();

  // Update module's average rating
  const allRatings = await TrainingProgress.find({
    moduleId: module._id,
    rating: { $ne: null },
  }).select("rating");

  if (allRatings.length > 0) {
    const avgRating =
      allRatings.reduce((sum, p) => sum + p.rating, 0) / allRatings.length;
    module.averageRating = Math.round(avgRating * 10) / 10;
    await module.save();
  }

  res.status(200).json({
    message: "Thank you for your feedback!",
    progress,
  });
});

// @desc    Get user's training statistics
// @route   GET /api/training/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await TrainingProgress.getUserStats(req.user._id);
  res.status(200).json(stats);
});

module.exports = {
  getAllModules,
  getModuleById,
  getModulesByCategory,
  getRecommendedModules,
  startModule,
  updateProgress,
  completeModule,
  submitQuiz,
  rateModule,
  getUserStats,
};
