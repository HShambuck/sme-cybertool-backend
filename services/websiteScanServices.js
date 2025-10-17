const WebsiteScanService = require("../services/websiteScanService");

const analyzeWebsite = async (req, res) => {
  try {
    const { url } = req.body;
    const userId = req.user._id; // From auth middleware

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    // Validate URL
    const domain = validateUrl(url);
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format",
      });
    }

    // Perform all checks
    const [sslGrade, headers, reputation, breachStatus] = await Promise.all([
      checkSSL(domain),
      checkSecurityHeaders(url),
      checkDomainReputation(url),
      checkBreaches(domain),
    ]);

    // Calculate security score
    const score = calculateScore(
      sslGrade,
      headers.present,
      headers.missing,
      reputation
    );

    // Prepare response
    const analysisResults = {
      url,
      domain,
      ssl_grade: sslGrade,
      headers: headers.present,
      issues: headers.missing,
      reputation,
      breach_status: breachStatus,
      score,
      timestamp: new Date().toISOString(),
    };

    // Save scan to database
    await WebsiteScanService.saveScan(userId, analysisResults);

    res.status(200).json({
      success: true,
      ...analysisResults,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze website",
      error: error.message,
    });
  }
};

// Get scan history
const getScanHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const scans = await WebsiteScanService.getUserScans(userId, limit);

    res.status(200).json({
      success: true,
      scans,
    });
  } catch (error) {
    console.error("Error fetching scan history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scan history",
    });
  }
};

// Get user scan statistics
const getScanStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await WebsiteScanService.getUserStats(userId);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

module.exports = {
  analyzeWebsite,
  getScanHistory,
  getScanStats,
};
