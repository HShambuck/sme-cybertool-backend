// routes/assessmentRoutes.js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createAssessment,
  getLatestAssessment,
  getAllAssessments,
  getAssessmentById,
} = require("../controllers/assessmentController");

// All routes require authentication
router.use(protect);

// @route   POST /api/assessments
// @desc    Create new assessment
// @access  Private
router.post("/", createAssessment);

// @route   GET /api/assessments/latest
// @desc    Get latest assessment for current user
// @access  Private
router.get("/latest", getLatestAssessment);

// @route   GET /api/assessments
// @desc    Get all assessments for current user
// @access  Private
router.get("/", getAllAssessments);

// @route   GET /api/assessments/:id
// @desc    Get single assessment by ID
// @access  Private
router.get("/:id", getAssessmentById);

// Test route to verify connection
router.post("/test", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ 
    message: "Test successful", 
    timestamp: new Date().toISOString() 
  });
});


module.exports = router;
