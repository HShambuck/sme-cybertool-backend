// backend/src/controllers/assessmentController.js
const asyncHandler = require("express-async-handler");
const Assessment = require("../models/Assessment");
const Recommendation = require("../models/Recommendations");
const axios = require("axios");

// --- HELPER: Fallback manual scoring ---
const calculateRiskScore = (questionsAnswered) => {
  const totalScore = questionsAnswered.reduce(
    (sum, q) => sum + (q.scoreImpact || 0),
    0,
  );

  // Maximum possible score (35 questions * 5 points max = 175)
  const maxPossibleScore = 175;
  const normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);

  let level;
  if (normalizedScore >= 80) {
    level = "LOW RISK";
  } else if (normalizedScore >= 60) {
    level = "MEDIUM RISK";
  } else if (normalizedScore >= 40) {
    level = "HIGH RISK";
  } else {
    level = "CRITICAL RISK";
  }

  return {
    score: normalizedScore,
    level,
    explanation: "Manual scoring applied based on answer weights.",
  };
};

// --- HELPER: AI scoring via Grok (xAI) ---
const aiScoreAssessment = async (questionsAnswered) => {
  try {
    // FIXED: Changed from XAI_API_KEY to GROK_API_KEY
    if (!process.env.GROK_API_KEY) {
      console.error("❌ GROK_API_KEY not found in environment variables");
      return null;
    }

    const responseText = questionsAnswered
      .map(
        (q) =>
          `Question ${q.questionId}: ${q.question || "N/A"}\nAnswer: ${
            q.answer
          }\nScore Impact: ${q.scoreImpact}`,
      )
      .join("\n\n");

    console.log("🤖 Sending to Grok API...");

    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions", // Grok API endpoint
      {
        model: process.env.GROK_MODEL, // Updated to latest Grok model
        messages: [
          {
            role: "system",
            content: `You are a cybersecurity risk assessor for small and medium enterprises.
Analyze the assessment answers carefully and compute a RISK SCORE between 0–100.
A higher score means **lower risk**. Base it on the severity and scoreImpact of responses.

IMPORTANT: Use second-person language (your, you, your organization) to make the assessment personal and direct.

Return ONLY valid JSON in this format:
{
  "score": <number between 0 and 100>,
  "level": "<Low Risk | Medium Risk | High Risk | Critical Risk>",
  "explanation": "Brief personalized explanation using 'your organization' and 'you' language"
}

Be sure to vary the score depending on how strong or weak the answers are — do not always use the same value.
Keep the explanation conversational and personalized.`,
          },
          {
            role: "user",
            content: `Analyze this cybersecurity assessment and provide a personalized risk score:\n\n${responseText}\n\nCalculate and return the risk score, risk level, and short, personalized explanation in JSON format.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 600,
      },
      {
        headers: {
          // FIXED: Changed from XAI_API_KEY to GROK_API_KEY
          Authorization: `Bearer ${process.env.GROK_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      },
    );

    console.log("✅ Grok API response received");

    const content = response.data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("❌ No content in Grok response");
      return null;
    }

    console.log("📄 Raw AI response:", content);

    let aiResult;
    try {
      aiResult = JSON.parse(content);
    } catch (parseError) {
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        console.error("❌ Could not extract JSON from response");
        return null;
      }
    }

    if (
      !aiResult.score ||
      !aiResult.level ||
      typeof aiResult.score !== "number"
    ) {
      console.error("❌ Invalid AI response structure:", aiResult);
      return null;
    }

    aiResult.score = Math.min(100, Math.max(0, parseInt(aiResult.score)));

    console.log("✅ AI scoring successful:", aiResult);
    return aiResult;
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      console.error("⏱️ Grok API request timeout");
    } else if (err.response) {
      console.error(
        "❌ Grok API error:",
        err.response.status,
        err.response.data,
      );
    } else if (err.request) {
      console.error("❌ No response from Grok API");
    } else {
      console.error("❌ Grok API error:", err.message);
    }
    return null;
  }
};

// --- HELPER: Category mapping ---
const getCategoryFromQuestionId = (questionId) => {
  const num = parseInt(questionId.replace("q", ""));

  // Questions 1-5: Access Control & Authentication
  if (num >= 1 && num <= 5) return "security_measure";

  // Questions 6-10: Backup & Recovery
  if (num >= 6 && num <= 10) return "data_protection";

  // Questions 11-14: Software & Systems
  if (num >= 11 && num <= 14) return "technical";

  // Questions 15-18: Phishing & Email Security
  if (num >= 15 && num <= 18) return "training";

  // Questions 19-22: Network Security
  if (num >= 19 && num <= 22) return "technical";

  // Questions 23-25: Incident Response & Monitoring
  if (num >= 23 && num <= 25) return "policy";

  // Questions 26-28: Physical Security
  if (num >= 26 && num <= 28) return "physical_security";

  // Questions 29-31: Device Security
  if (num >= 29 && num <= 31) return "device_security";

  // Questions 32-33: Data Classification & Compliance
  if (num >= 32 && num <= 33) return "data_protection";

  // Questions 34-35: Vendor Management
  if (num >= 34 && num <= 35) return "vendor";

  // Default fallback
  return "policy";
};

// Generate recommendations based on weak areas
const generateRecommendations = async (questionsAnswered, assessmentId) => {
  const weakAreas = questionsAnswered.filter((q) => q.scoreImpact <= 2);

  const recommendationMap = {
    q1: "Implement unique user accounts for all employees to improve access control.",
    q2: "Enable multi-factor authentication (MFA) on all critical business systems.",
    q3: "Enforce strong password policies requiring minimum 12 characters with complexity.",
    q4: "Establish a process to immediately revoke access for departing employees.",
    q5: "Deploy a company-wide password manager for secure credential storage.",
    q6: "Set up automated daily backups of all critical business data.",
    q7: "Implement the 3-2-1 backup rule: 3 copies, 2 different media, 1 offsite.",
    q8: "Schedule quarterly backup restoration tests to ensure recovery capability.",
    q9: "Develop a documented disaster recovery plan with clear RTO/RPO objectives.",
    q10: "Encrypt all backups and isolate them from production networks.",
    q11: "Enable automatic updates for operating systems and critical software.",
    q12: "Conduct a software audit and replace all unlicensed software.",
    q13: "Deploy enterprise-grade antivirus/anti-malware on all devices.",
    q14: "Create and maintain a comprehensive IT asset inventory.",
    q15: "Implement quarterly phishing awareness training for all employees.",
    q16: "Deploy advanced email filtering and anti-spam solutions.",
    q17: "Establish a phishing reporting system and incident response process.",
    q18: "Implement multi-step verification for sensitive transactions and wire transfers.",
    q19: "Upgrade Wi-Fi security to WPA3 or WPA2-Enterprise encryption.",
    q20: "Install a hardware firewall to protect your network perimeter.",
    q21: "Require VPN usage for all remote access to company resources.",
    q22: "Create a separate guest Wi-Fi network isolated from business systems.",
    q23: "Develop and test a comprehensive cybersecurity incident response plan.",
    q24: "Obtain cybersecurity insurance to mitigate financial risk from breaches.",
    q25: "Implement continuous security monitoring and logging on all systems.",
    q26: "Restrict physical access to servers and networking gear with locked rooms.",
    q27: "Deploy CCTV and access logs with periodic reviews of footage.",
    q28: "Require employee ID badges or keycards for building access.",
    q29: "Encrypt all laptops and mobile devices to protect sensitive data.",
    q30: "Enforce mandatory device lock with strong authentication.",
    q31: "Implement a BYOD policy with Mobile Device Management (MDM).",
    q32: "Classify and label sensitive data with access policies.",
    q33: "Ensure compliance with privacy regulations (GDPR, CCPA, local laws).",
    q34: "Perform cybersecurity due diligence before engaging vendors.",
    q35: "Include mandatory data protection clauses in vendor contracts.",
  };

  const recDocs = weakAreas
    .filter((q) => recommendationMap[q.questionId])
    .map((q) => ({
      assessmentId,
      text: recommendationMap[q.questionId],
      priority: q.scoreImpact === 0 ? "high" : "medium",
      status: "pending",
      category: getCategoryFromQuestionId(q.questionId),
    }));

  if (recDocs.length === 0) {
    console.log("✅ No recommendations needed - excellent security posture!");
    return [];
  }

  try {
    const createdRecs = await Recommendation.insertMany(recDocs);
    console.log(
      `✅ Successfully created ${createdRecs.length} recommendations`,
    );
    return createdRecs.map((r) => r._id);
  } catch (error) {
    console.error("❌ Error creating recommendations:", error);
    throw error;
  }
};

// Normalize level from AI response
function mapLevel(aiLevel) {
  const normalized = aiLevel.trim().toLowerCase();
  if (normalized.includes("low")) return "LOW RISK";
  if (normalized.includes("medium")) return "MEDIUM RISK";
  if (normalized.includes("high")) return "HIGH RISK";
  if (normalized.includes("critical")) return "CRITICAL RISK";
  return "MEDIUM RISK"; // Default fallback
}

// --- CREATE ASSESSMENT ---
const createAssessment = asyncHandler(async (req, res) => {
  const { questionsAnswered } = req.body;

  if (!questionsAnswered || !Array.isArray(questionsAnswered)) {
    res.status(400);
    throw new Error("Invalid assessment data");
  }

  console.log("📝 Incoming assessment:", questionsAnswered.length, "questions");

  // --- Try AI scoring first ---
  let aiResult = await aiScoreAssessment(questionsAnswered);

  // --- Fallback to manual if AI fails ---
  if (!aiResult) {
    console.log("⚠️ AI scoring failed, using manual calculation");
    aiResult = calculateRiskScore(questionsAnswered);
  } else {
    console.log("✅ Using AI scoring:", aiResult);
  }

  // --- Save assessment ---
  const assessment = await Assessment.create({
    userId: req.user._id,
    questionsAnswered,
    score: aiResult.score,
    level: mapLevel(aiResult.level),
    explanation: aiResult.explanation,
    scoringMethod:
      aiResult.explanation === "Manual scoring applied based on answer weights."
        ? "manual"
        : "ai",
    // FIXED: Updated AI model name to Grok
    aiModel:
      aiResult.explanation !== "Manual scoring applied based on answer weights."
        ? "grok-beta"
        : undefined,
  });

  console.log("💾 Assessment saved:", assessment._id);

  // --- Generate recommendations ---
  console.log("🔄 Generating recommendations...");
  const recs = await generateRecommendations(questionsAnswered, assessment._id);

  console.log("✅ Generated", recs.length, "recommendations");

  // Update assessment with recommendation IDs
  assessment.recommendationIds = recs;
  console.log("💾 Saving assessment with recommendations...");

  await assessment.save();
  console.log("✅ Assessment saved with recommendations");

  // Populate recommendations before sending
  console.log("🔄 Populating recommendations...");
  const populatedAssessment = await Assessment.findById(assessment._id)
    .populate("recommendationIds")
    .lean();
  console.log("✅ Recommendations populated");

  console.log("📤 Sending response to frontend");

  // Send response
  const responseData = {
    message: "Assessment created successfully",
    assessment: {
      _id: populatedAssessment._id,
      userId: populatedAssessment.userId,
      questionsAnswered: populatedAssessment.questionsAnswered,
      score: populatedAssessment.score,
      level: populatedAssessment.level,
      explanation: populatedAssessment.explanation,
      scoringMethod: populatedAssessment.scoringMethod,
      aiModel: populatedAssessment.aiModel,
      assessmentDate: populatedAssessment.assessmentDate,
      recommendationIds: populatedAssessment.recommendationIds,
    },
  };

  console.log("📦 Response data structure:", {
    hasAssessment: !!responseData.assessment,
    assessmentId: responseData.assessment._id,
    scoringMethod: responseData.assessment.scoringMethod,
    recommendationCount: responseData.assessment.recommendationIds?.length,
  });

  res.status(201).json(responseData);

  console.log("✅ Response sent successfully");
});

// --- GET LATEST ASSESSMENT ---
const getLatestAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findOne({ userId: req.user._id })
    .sort({ assessmentDate: -1 })
    .populate("recommendationIds");

  if (!assessment) {
    res.status(404);
    throw new Error("No assessments found");
  }

  res.status(200).json(assessment);
});

// --- GET ALL ASSESSMENTS ---
const getAllAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({ userId: req.user._id })
    .sort({ assessmentDate: -1 })
    .populate("recommendationIds");

  res.status(200).json(assessments);
});

// --- GET BY ID ---
const getAssessmentById = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id).populate(
    "recommendationIds",
  );

  if (!assessment) {
    res.status(404);
    throw new Error("Assessment not found");
  }

  if (assessment.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  res.status(200).json(assessment);
});

module.exports = {
  createAssessment,
  getLatestAssessment,
  getAllAssessments,
  getAssessmentById,
};
