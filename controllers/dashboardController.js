const asyncHandler = require("express-async-handler");
const Assessment = require("../models/Assessment");
const Recommendation = require("../models/Recommendations");
const TrainingProgress = require("../models/TrainingProgress");
const ThreatUpdate = require("../models/ThreatUpdate");
const Alert = require("../models/Alert");
const TrainingModule = require("../models/TrainingModule"); // To get total modules

// @desc    Get all dashboard data for a logged-in user
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id; // User ID from auth middleware

  // 1. Latest Risk Assessment
  const latestAssessment = await Assessment.findOne({ userId })
    .sort({ assessmentDate: -1 }) // Get the most recent one
    .populate("recommendationIds") // Populate recommendations if you want them nested
    .lean(); // Return plain JS object, not Mongoose document

  // 2. Recommendations (from the latest assessment or overall pending)
  let recommendations = [];
  if (latestAssessment) {
    recommendations = await Recommendation.find({
      assessmentId: latestAssessment._id,
      status: "pending", // Only show pending recommendations on dashboard
    }).limit(3); // Show top 3 pending recommendations
  }
  // If you want ALL pending recommendations for the user, regardless of assessment:
  // recommendations = await Recommendation.find({ userId: userId, status: 'pending' }).limit(3);

  // 3. Recent Alerts
  const recentAlerts = await Alert.find({ userId })
    .sort({ timestamp: -1 })
    .limit(3);

  // 4. Training Progress
  const completedModulesCount = await TrainingProgress.countDocuments({
    userId,
    status: "completed",
  });
  const totalModulesCount = await TrainingModule.countDocuments(); // Assuming all SMEs see all modules

  let trainingProgress = {
    percentage: 0,
    completed: completedModulesCount,
    total: totalModulesCount,
  };

  if (totalModulesCount > 0) {
    trainingProgress.percentage = Math.round(
      (completedModulesCount / totalModulesCount) * 100
    );
  }

  // 5. Local Threat Updates (Global, not user-specific, but fetch recent)
  const threatUpdates = await ThreatUpdate.find({})
    .sort({ publicationDate: -1 })
    .limit(3);

  // Combine all data
  res.json({
    riskData: latestAssessment
      ? {
          score: latestAssessment.score,
          level: latestAssessment.level,
          lastAssessment: latestAssessment.assessmentDate,
          // You'd calculate 'completedWeeksAgo' on the frontend
        }
      : null,
    recommendations: recommendations.map((rec) => ({
      id: rec._id,
      text: rec.text,
      priority: rec.priority,
      status: rec.status,
      // You'd handle 'completed' checkbox state on frontend based on status
    })),
    recentAlerts: recentAlerts.map((alert) => ({
      id: alert._id,
      type: alert.type,
      title: alert.title,
      date: alert.timestamp, // Format on frontend
    })),
    trainingProgress: trainingProgress,
    threatUpdates: threatUpdates.map((threat) => ({
      id: threat._id,
      type: threat.type,
      title: threat.title,
      date: threat.publicationDate, // Format on frontend
    })),
  });
});

module.exports = { getDashboardData };
