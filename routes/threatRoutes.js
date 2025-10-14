// routes/threatRoutes.js
const express = require("express");
const router = express.Router();
const ThreatUpdate = require("../models/ThreatUpdate");
const protect = require("../middleware/authMiddleware");
const axios = require("axios");

// ===========================
// HELPER FUNCTIONS
// ===========================

// Fetch threats from external APIs
async function fetchExternalThreats() {
  const threats = [];

  // 1. Fetch from CISA (U.S. Cybersecurity & Infrastructure Security Agency)
  try {
    const cisaResponse = await axios.get(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      { timeout: 5000 }
    );

    if (cisaResponse.data && cisaResponse.data.vulnerabilities) {
      const cisaThreats = cisaResponse.data.vulnerabilities
        .slice(0, 5)
        .map((vuln) => ({
          _id: `cisa-${vuln.cveID}`,
          title: `${vuln.cveID}: ${vuln.vulnerabilityName}`,
          description: `${vuln.shortDescription} Vendor: ${vuln.vendorProject}, Product: ${vuln.product}`,
          severity: "high",
          category: "vulnerability",
          source: "CISA",
          publishedAt: new Date(vuln.dateAdded),
          affectedRegions: ["Global"],
          recommendations: [
            vuln.requiredAction || "Apply vendor security updates immediately",
            "Review and patch affected systems",
            "Monitor for signs of exploitation",
          ],
          isActive: true,
          isExternal: true,
        }));

      threats.push(...cisaThreats);
    }
  } catch (error) {
    console.error("CISA API error:", error.message);
  }

  // 2. Fetch from AlienVault OTX (Optional - requires API key)
  // Uncomment and add your API key if you want to use this
  try {
    const OTX_API_KEY = process.env.OTX_API_KEY;
    if (OTX_API_KEY) {
      const otxResponse = await axios.get(
        "https://otx.alienvault.com/api/v1/pulses/subscribed",
        {
          timeout: 5000,
          headers: {
            "X-OTX-API-KEY": OTX_API_KEY,
          },
        }
      );

      if (otxResponse.data && otxResponse.data.results) {
        const otxThreats = otxResponse.data.results
          .slice(0, 3)
          .map((pulse) => ({
            _id: `otx-${pulse.id}`,
            title: pulse.name,
            description: pulse.description || "No description available",
            severity: pulse.tags.includes("critical") ? "critical" : "high",
            category: "malware",
            source: "AlienVault OTX",
            publishedAt: new Date(pulse.created),
            affectedRegions: ["Global"],
            recommendations: [
              "Review IOCs (Indicators of Compromise) associated with this threat",
              "Update security rules and signatures",
              "Monitor network traffic for suspicious patterns",
            ],
            isActive: true,
            isExternal: true,
          }));

        threats.push(...otxThreats);
      }
    }
  } catch (error) {
    console.error("AlienVault OTX API error:", error.message);
  }

  return threats;
}

// Deduplicate threats based on title similarity
function deduplicateThreats(threats) {
  const seen = new Set();
  return threats.filter((threat) => {
    const key = threat.title.toLowerCase().trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// ===========================
// ROUTES
// ===========================

// Get all active threat updates (with external API integration)
router.get("/", protect, async (req, res) => {
  try {
    // Try to fetch from external APIs first
    let externalThreats = [];
    let apiSuccess = false;

    try {
      externalThreats = await fetchExternalThreats();
      apiSuccess = externalThreats.length > 0;

      if (apiSuccess) {
        console.log(
          `✅ Successfully fetched ${externalThreats.length} threats from external APIs`
        );
      }
    } catch (error) {
      console.error("⚠️ External API fetch failed:", error.message);
    }

    // If external APIs succeeded, return only external threats
    if (apiSuccess) {
      const uniqueThreats = deduplicateThreats(externalThreats);
      return res.json(uniqueThreats);
    }

    // FALLBACK: If external APIs failed, fetch from local database
    console.log("📦 Using fallback: Fetching threats from local database");
    const localThreats = await ThreatUpdate.find({ isActive: true })
      .sort({ publishedAt: -1 })
      .limit(20);

    if (localThreats.length === 0) {
      console.log("⚠️ No threats found in database either");
    }

    res.json(localThreats);
  } catch (error) {
    console.error("❌ Error fetching threats:", error);
    res.status(500).json({ message: "Failed to fetch threat updates" });
  }
});

// Get threat by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const threat = await ThreatUpdate.findById(req.params.id);

    if (!threat) {
      return res.status(404).json({ message: "Threat update not found" });
    }

    res.json(threat);
  } catch (error) {
    console.error("Error fetching threat:", error);
    res.status(500).json({ message: "Failed to fetch threat update" });
  }
});

// Filter threats by severity
router.get("/filter/severity/:level", protect, async (req, res) => {
  try {
    const { level } = req.params;
    const threats = await ThreatUpdate.find({
      severity: level,
      isActive: true,
    }).sort({ publishedAt: -1 });

    res.json(threats);
  } catch (error) {
    console.error("Error filtering threats:", error);
    res.status(500).json({ message: "Failed to filter threats" });
  }
});

// Filter threats by category
router.get("/filter/category/:category", protect, async (req, res) => {
  try {
    const { category } = req.params;
    const threats = await ThreatUpdate.find({
      category,
      isActive: true,
    }).sort({ publishedAt: -1 });

    res.json(threats);
  } catch (error) {
    console.error("Error filtering threats:", error);
    res.status(500).json({ message: "Failed to filter threats" });
  }
});

// Search threats by keyword
router.get("/search/:keyword", protect, async (req, res) => {
  try {
    const { keyword } = req.params;
    const threats = await ThreatUpdate.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { source: { $regex: keyword, $options: "i" } },
      ],
      isActive: true,
    }).sort({ publishedAt: -1 });

    res.json(threats);
  } catch (error) {
    console.error("Error searching threats:", error);
    res.status(500).json({ message: "Failed to search threats" });
  }
});

// Create new threat update (admin only)
router.post("/", protect, async (req, res) => {
  try {
    const threat = new ThreatUpdate({
      ...req.body,
      publishedAt: new Date(),
      isActive: true,
    });

    await threat.save();
    res.status(201).json(threat);
  } catch (error) {
    console.error("Error creating threat:", error);
    res.status(500).json({ message: "Failed to create threat update" });
  }
});

// Update threat update (admin only)
router.put("/:id", protect, async (req, res) => {
  try {
    const threat = await ThreatUpdate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!threat) {
      return res.status(404).json({ message: "Threat update not found" });
    }

    res.json(threat);
  } catch (error) {
    console.error("Error updating threat:", error);
    res.status(500).json({ message: "Failed to update threat" });
  }
});

// Delete threat update (admin only)
router.delete("/:id", protect, async (req, res) => {
  try {
    const threat = await ThreatUpdate.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!threat) {
      return res.status(404).json({ message: "Threat update not found" });
    }

    res.json({ message: "Threat update deactivated successfully" });
  } catch (error) {
    console.error("Error deleting threat:", error);
    res.status(500).json({ message: "Failed to delete threat" });
  }
});

// Get threat statistics
router.get("/stats/summary", protect, async (req, res) => {
  try {
    const stats = await ThreatUpdate.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryStats = await ThreatUpdate.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      severityBreakdown: stats,
      categoryBreakdown: categoryStats,
      totalThreats: await ThreatUpdate.countDocuments({ isActive: true }),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

module.exports = router;
