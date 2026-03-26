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
const TrainingModule = require("../models/TrainingModule");

// All routes require authentication
router.use(protect);

// Get user's training statistics
router.get("/stats", getUserStats);

// Get recommended modules based on user's assessment
router.get("/recommended", getRecommendedModules);


// This route powers the "Recommended Priority" section in TrainingModules.
// It accepts multiple ?ids= query params and returns those specific modules.
// Example request: GET /api/training/by-ids?ids=abc123&ids=def456&ids=ghi789
router.get("/by-ids", protect, async (req, res) => {
  try {
    let ids = req.query.ids;
 
    // Normalize to array (single id comes as a string)
    if (!ids) return res.status(200).json([]);
    if (!Array.isArray(ids)) ids = [ids];
 
    const modules = await TrainingModule.find({
      _id: { $in: ids },
      isPublished: true,
    }).lean();
 
    // Optionally attach user progress if you have a UserProgress model
    // const withProgress = await attachUserProgress(modules, req.user._id);
 
    res.status(200).json(modules);
  } catch (err) {
    console.error("Error fetching modules by IDs:", err);
    res.status(500).json({ message: "Failed to fetch modules" });
  }
});

// Get all modules (with optional filters)
router.get("/", getAllModules);

// Get modul1es by category
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
