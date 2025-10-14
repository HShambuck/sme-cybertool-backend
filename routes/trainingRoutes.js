// routes/trainingRoutes.js
const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/trainingController");
const  protect  = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Get user's training statistics
router.get("/stats", getUserStats);

// Get recommended modules based on user's assessment
router.get("/recommended", getRecommendedModules);

// Get all modules (with optional filters)
router.get("/", getAllModules);

// Get modules by category
router.get("/category/:category", getModulesByCategory);

// Get single module by ID
router.get("/:id", getModuleById);

// Start a module
router.post("/:id/start", startModule);

// Update progress (complete step or update checklist)
router.put("/:id/progress", updateProgress);

// Complete a module
router.post("/:id/complete", completeModule);

// Submit quiz
router.post("/:id/quiz", submitQuiz);

// Rate a module
router.post("/:id/rate", rateModule);

module.exports = router;
