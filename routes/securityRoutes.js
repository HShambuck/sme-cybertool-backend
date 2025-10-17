const express = require("express");
const router = express.Router();
const {
  analyzeWebsite,
  getScanHistory,
  getScanStats,
} = require("../controllers/securityController");
const protect  = require("../middleware/authMiddleware");
const { securityAnalysisLimiter } = require("../middleware/rateLimiter");

router.post("/analyze", protect, securityAnalysisLimiter, analyzeWebsite);
router.get("/history", protect, getScanHistory);
router.get("/stats", protect, getScanStats);

module.exports = router;