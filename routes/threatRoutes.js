// routes/threatRoutes.js
const express = require("express");
const router = express.Router();
const ThreatUpdate = require("../models/ThreatUpdate");
const protect = require("../middleware/authMiddleware");
const axios = require("axios");

// ════════════════════════════════════════════════════════
// AI: Generate SME-relevant recommendations via Groq
// ════════════════════════════════════════════════════════
const generateThreatRecommendations = async (threat) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  if (!apiKey) return null;

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model,
        max_completion_tokens: 400,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `You are a cybersecurity advisor for small and medium enterprises (SMEs) in Africa.
Return ONLY a JSON array of exactly 3 short, practical recommendations for an SME with limited IT resources.
No markdown, no preamble. Format: ["recommendation 1", "recommendation 2", "recommendation 3"]
Each recommendation must be under 20 words and immediately actionable.`,
          },
          {
            role: "user",
            content: `Threat: ${threat.title}\nDescription: ${threat.description}\nCategory: ${threat.category}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    const raw = res.data?.choices?.[0]?.message?.content || "";
    const match = raw.match(/\[[\s\S]*?\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (err) {
    console.error("Groq threat recommendations error:", err.message);
    return null;
  }
};

// Fallback recommendations based on category
const getFallbackRecommendations = (category, requiredAction) => {
  const base = requiredAction ? [requiredAction] : [];

  const categoryDefaults = {
    vulnerability: [
      "Apply the vendor patch or update immediately on all affected systems.",
      "If patching is not possible, isolate the affected system from the network.",
      "Check your software inventory — identify all instances of the affected product.",
    ],
    ransomware: [
      "Ensure offline backups are current and not connected to your main network.",
      "Train staff to recognise phishing emails which are the primary ransomware entry point.",
      "Restrict administrative privileges to only the staff who absolutely need them.",
    ],
    phishing: [
      "Alert all staff about this phishing campaign with a real example if available.",
      "Enable multi-factor authentication on email accounts immediately.",
      "Report any received instances to your IT contact and email provider.",
    ],
    malware: [
      "Run a full antivirus scan on all endpoints immediately.",
      "Check for any unfamiliar programs, browser extensions, or scheduled tasks.",
      "Change passwords for all business accounts from a clean, unaffected device.",
    ],
    data_breach: [
      "Check if any of your business email addresses appear in the breach using HaveIBeenPwned.",
      "Force password resets for any accounts using credentials from the breached service.",
      "Review what data your business shares with third-party services.",
    ],
    general: [
      "Review your current security posture against this threat type.",
      "Ensure all software and systems are updated to the latest versions.",
      "Brief your team on this threat and what to watch out for.",
    ],
  };

  const defaults = categoryDefaults[category] || categoryDefaults.general;
  return base.length > 0 ? [base[0], ...defaults.slice(0, 2)] : defaults;
};

// ════════════════════════════════════════════════════════
// FETCH: CISA Known Exploited Vulnerabilities
// ════════════════════════════════════════════════════════
async function fetchCISAThreats() {
  try {
    const res = await axios.get(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      { timeout: 5000 },
    );

    if (!res.data?.vulnerabilities) return [];

    return res.data.vulnerabilities.slice(0, 4).map((vuln) => ({
      _id: `cisa-${vuln.cveID}`,
      title: `${vuln.cveID}: ${vuln.vulnerabilityName}`,
      description: `${vuln.shortDescription} Affected: ${vuln.vendorProject} — ${vuln.product}.`,
      severity: "high",
      category: "vulnerability",
      source: "CISA KEV",
      publishedAt: new Date(vuln.dateAdded),
      affectedRegions: ["Global"],
      requiredAction: vuln.requiredAction,
      isActive: true,
      isExternal: true,
    }));
  } catch (err) {
    console.error("CISA API error:", err.message);
    return [];
  }
}

// ════════════════════════════════════════════════════════
// FETCH: AlienVault OTX
// Filters for SME-relevant and business-focused pulses
// ════════════════════════════════════════════════════════
async function fetchOTXThreats() {
  const apiKey = process.env.OTX_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await axios.get(
      "https://otx.alienvault.com/api/v1/pulses/subscribed?limit=20",
      {
        timeout: 5000,
        headers: { "X-OTX-API-KEY": apiKey },
      },
    );

    if (!res.data?.results) return [];

    // Map OTX category tags to our schema categories
    const mapCategory = (tags = []) => {
      const t = tags.map((x) => x.toLowerCase()).join(" ");
      if (t.includes("ransom")) return "ransomware";
      if (t.includes("phish")) return "phishing";
      if (t.includes("malware") || t.includes("rat") || t.includes("trojan"))
        return "malware";
      if (t.includes("cve") || t.includes("exploit") || t.includes("vuln"))
        return "vulnerability";
      if (t.includes("breach") || t.includes("leak")) return "data_breach";
      return "general";
    };

    const mapSeverity = (tags = []) => {
      const t = tags.map((x) => x.toLowerCase()).join(" ");
      if (t.includes("critical")) return "critical";
      if (t.includes("high")) return "high";
      if (t.includes("medium")) return "warning";
      return "high"; // OTX pulses are generally high relevance
    };

    return res.data.results.slice(0, 4).map((pulse) => ({
      _id: `otx-${pulse.id}`,
      title: pulse.name,
      description:
        pulse.description?.substring(0, 300) ||
        "Threat intelligence pulse from AlienVault OTX community.",
      severity: mapSeverity(pulse.tags),
      category: mapCategory(pulse.tags),
      source: "AlienVault OTX",
      publishedAt: new Date(pulse.created),
      affectedRegions:
        pulse.targeted_countries?.length > 0
          ? pulse.targeted_countries
          : ["Global"],
      requiredAction: null,
      isActive: true,
      isExternal: true,
    }));
  } catch (err) {
    console.error("AlienVault OTX API error:", err.message);
    return [];
  }
}

// ════════════════════════════════════════════════════════
// MAIN ROUTE: GET /api/threats
// ════════════════════════════════════════════════════════
router.get("/", protect, async (req, res) => {
  try {
    const [cisaThreats, otxThreats] = await Promise.all([
      fetchCISAThreats(),
      fetchOTXThreats(),
    ]);

    let combined = [...cisaThreats, ...otxThreats];

    // Deduplicate by title
    const seen = new Set();
    combined = combined.filter((t) => {
      const key = t.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (combined.length === 0) {
      console.log(
        "📦 External APIs returned nothing — using database fallback",
      );
      const local = await ThreatUpdate.find({ isActive: true })
        .sort({ publishedAt: -1 })
        .limit(20);
      return res.json(local);
    }

    // Generate AI recommendations for each threat (parallel, with fallback)
    const threatsWithRecs = await Promise.all(
      combined.map(async (threat) => {
        const aiRecs = await generateThreatRecommendations(threat);
        const recommendations =
          aiRecs ||
          getFallbackRecommendations(threat.category, threat.requiredAction);
        return { ...threat, recommendations };
      }),
    );

    console.log(
      `✅ Successfully fetched ${threatsWithRecs.length} threats from external APIs`,
    );
    return res.json(threatsWithRecs);
  } catch (err) {
    console.error("❌ Error fetching threats:", err);
    res.status(500).json({ message: "Failed to fetch threat updates" });
  }
});

// Keep remaining routes unchanged
router.get("/:id", protect, async (req, res) => {
  try {
    const threat = await ThreatUpdate.findById(req.params.id);
    if (!threat)
      return res.status(404).json({ message: "Threat update not found" });
    res.json(threat);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch threat update" });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const threat = new ThreatUpdate({
      ...req.body,
      publishedAt: new Date(),
      isActive: true,
    });
    await threat.save();
    res.status(201).json(threat);
  } catch (err) {
    res.status(500).json({ message: "Failed to create threat update" });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const threat = await ThreatUpdate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!threat)
      return res.status(404).json({ message: "Threat update not found" });
    res.json(threat);
  } catch (err) {
    res.status(500).json({ message: "Failed to update threat" });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const threat = await ThreatUpdate.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!threat)
      return res.status(404).json({ message: "Threat update not found" });
    res.json({ message: "Threat update deactivated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete threat" });
  }
});

module.exports = router;
