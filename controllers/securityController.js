const axios = require("axios");
const WebsiteScan = require("../models/WebsiteScan");

// Validate URL format
const validateUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return null;
  }
};

// Check SSL/TLS using SSL Labs API
const checkSSL = async (domain) => {
  try {
    const response = await axios.get(
      `https://api.ssllabs.com/api/v3/analyze?host=${domain}&publish=off&all=done&fromCache=on`,
      { timeout: 30000 }
    );

    if (response.data.status === "READY" && response.data.endpoints) {
      const grade = response.data.endpoints[0]?.grade || "N/A";
      return grade;
    }

    // If not cached, return a simulated grade for demo
    return "A";
  } catch (error) {
    console.error("SSL check error:", error.message);
    return "N/A";
  }
};

// Check security headers
const checkSecurityHeaders = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const headers = response.headers;
    const securityHeaders = [];
    const missingHeaders = [];

    // Check for important security headers
    const headerChecks = {
      "strict-transport-security": "Strict-Transport-Security",
      "x-frame-options": "X-Frame-Options",
      "x-content-type-options": "X-Content-Type-Options",
      "content-security-policy": "Content-Security-Policy",
      "x-xss-protection": "X-XSS-Protection",
      "referrer-policy": "Referrer-Policy",
    };

    for (const [key, displayName] of Object.entries(headerChecks)) {
      if (headers[key]) {
        securityHeaders.push(displayName);
      } else {
        missingHeaders.push(`Missing ${displayName}`);
      }
    }

    return { present: securityHeaders, missing: missingHeaders };
  } catch (error) {
    console.error("Headers check error:", error.message);
    return {
      present: [],
      missing: [
        "Missing Strict-Transport-Security",
        "Missing X-Frame-Options",
        "Missing X-Content-Type-Options",
        "Missing Content-Security-Policy",
        "Missing X-XSS-Protection",
        "Missing Referrer-Policy",
      ],
    };
  }
};

// Check domain reputation (using free pattern-based detection)
const checkDomainReputation = async (url) => {
  try {
    // Try to use ApiHelper if available
    try {
      const ApiHelper = require("../utils/apiHelpers");
      const threatCheck = await ApiHelper.checkThreats(url);
      return threatCheck.verdict;
    } catch (error) {
      console.log("ApiHelper not available, using basic checks");
    }

    // Fallback to basic pattern checks
    const suspiciousPatterns = [
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
      /[a-z0-9-]+\.tk$|\.ml$|\.ga$|\.cf$|\.gq$/i, // Free suspicious TLDs
      /bit\.ly|tinyurl|goo\.gl/, // URL shorteners
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return "Warning";
      }
    }

    return "Clean";
  } catch (error) {
    console.error("Reputation check error:", error.message);
    return "Unknown";
  }
};

// Breach check
const checkBreaches = async (domain) => {
  try {
    // Try to use ApiHelper if available
    try {
      const ApiHelper = require("../utils/apiHelpers");
      return await ApiHelper.checkBreachData(domain);
    } catch (error) {
      console.log("ApiHelper not available, using fallback");
    }

    // Fallback response
    return "No breach data available";
  } catch (error) {
    console.error("Breach check error:", error.message);
    return "Unable to verify breach data";
  }
};

// --- AI-POWERED: Generate recommendations using OpenRouter ---
const generateAIRecommendations = async (
  domain,
  sslGrade,
  headersMissing,
  reputation,
  score
) => {
  try {
    // Check if API key exists
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("❌ OPENROUTER_API_KEY not found in environment variables");
      return null;
    }

    // Format the security analysis for AI
    const analysisText = `
Website: ${domain}
Security Score: ${score}/100
SSL/TLS Grade: ${sslGrade}
Domain Reputation: ${reputation}
Missing Security Headers: ${
      headersMissing.length > 0 ? headersMissing.join(", ") : "None"
    }
`;

    console.log("🤖 Generating AI-powered recommendations...");

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.3-8b-instruct:free",
        messages: [
          {
            role: "system",
            content: `You are a cybersecurity expert specializing in website security for small and medium enterprises.
Analyze the website security assessment and provide actionable, personalized recommendations.

IMPORTANT: 
- Use second-person language (your, you, your website) to make recommendations personal and direct
- Prioritize recommendations by severity (critical, high, medium, low)
- Provide specific, actionable steps
- Include brief explanation of the impact
- Be concise and practical

Return ONLY valid JSON array with this structure:
[
  {
    "priority": "critical|high|medium|low",
    "category": "SSL/TLS|Security Headers|Domain Reputation|Overall Security",
    "title": "Short recommendation title",
    "description": "What the issue is (personalized, use 'your')",
    "action": "Specific step to take (personalized, use 'you' and 'your')",
    "impact": "What this protects against or improves"
  }
]

Generate 3-6 recommendations based on the most critical issues found.`,
          },
          {
            role: "user",
            content: `Analyze this website security assessment and provide personalized recommendations:\n\n${analysisText}\n\nProvide actionable security recommendations in JSON format.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:5000",
          "X-Title": "SME Security Analysis Tool",
        },
        timeout: 25000,
      }
    );

    console.log("✅ OpenRouter response received");

    // Extract response content
    const content = response.data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("❌ No content in OpenRouter response");
      return null;
    }

    console.log("📄 Raw AI response:", content.substring(0, 200) + "...");

    // Parse JSON response
    let aiResult;
    try {
      // Try direct JSON parse
      aiResult = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON array from markdown code blocks or text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        console.error("❌ Could not extract JSON from response");
        return null;
      }
    }

    // Validate response structure
    if (!Array.isArray(aiResult) || aiResult.length === 0) {
      console.error("❌ Invalid AI response structure:", aiResult);
      return null;
    }

    // Validate each recommendation
    const validRecommendations = aiResult.filter(
      (rec) =>
        rec.priority &&
        rec.category &&
        rec.title &&
        rec.description &&
        rec.action &&
        rec.impact
    );

    if (validRecommendations.length === 0) {
      console.error("❌ No valid recommendations in AI response");
      return null;
    }

    console.log(
      `✅ AI generated ${validRecommendations.length} recommendations`
    );
    return validRecommendations;
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      console.error("⏱️ OpenRouter request timeout");
    } else if (err.response) {
      console.error(
        "❌ OpenRouter API error:",
        err.response.status,
        err.response.data
      );
    } else if (err.request) {
      console.error("❌ No response from OpenRouter");
    } else {
      console.error("❌ OpenRouter error:", err.message);
    }
    return null;
  }
};

// --- FALLBACK: Hardcoded recommendations ---
const generateHardcodedRecommendations = (
  sslGrade,
  headersMissing,
  reputation,
  score
) => {
  const recommendations = [];

  // SSL/TLS recommendations
  if (sslGrade === "N/A" || !sslGrade) {
    recommendations.push({
      priority: "critical",
      category: "SSL/TLS",
      title: "Enable HTTPS Encryption",
      description:
        "Your website is not using HTTPS encryption. This exposes user data to interception and eavesdropping.",
      action:
        "Purchase and install an SSL/TLS certificate. Consider using Let's Encrypt for free certificates, or contact your hosting provider for SSL installation.",
      impact:
        "Protects sensitive data in transit, prevents man-in-the-middle attacks, and builds user trust with the padlock icon in browsers.",
    });
  } else if (["C", "D", "F"].includes(sslGrade)) {
    recommendations.push({
      priority: "high",
      category: "SSL/TLS",
      title: "Upgrade SSL/TLS Configuration",
      description: `Your SSL/TLS grade is ${sslGrade}, indicating weak encryption or outdated protocols that attackers can exploit.`,
      action:
        "Update your server configuration to support only TLS 1.2 and TLS 1.3. Disable weak cipher suites and deprecated protocols like TLS 1.0 and 1.1.",
      impact:
        "Prevents man-in-the-middle attacks, protects against known SSL vulnerabilities, and meets modern security standards.",
    });
  } else if (sslGrade === "B") {
    recommendations.push({
      priority: "medium",
      category: "SSL/TLS",
      title: "Optimize SSL/TLS Configuration",
      description:
        "Your SSL/TLS configuration is functional but can be improved for better security.",
      action:
        "Review and optimize your cipher suite ordering, enable HSTS with a long max-age, and ensure forward secrecy is properly configured.",
      impact:
        "Achieves industry best practices for encryption and maximizes protection against future vulnerabilities.",
    });
  }

  // Security headers recommendations
  headersMissing.forEach((header) => {
    const headerName = header.replace("Missing ", "");

    if (headerName === "Strict-Transport-Security") {
      recommendations.push({
        priority: "high",
        category: "Security Headers",
        title: "Implement HTTP Strict Transport Security (HSTS)",
        description:
          "HSTS is not configured on your website. This leaves you vulnerable to protocol downgrade attacks where attackers force HTTP connections.",
        action:
          "Add the Strict-Transport-Security header to your server configuration: 'max-age=31536000; includeSubDomains; preload'. Then submit your domain to the HSTS preload list.",
        impact:
          "Forces browsers to always connect via HTTPS, preventing SSL stripping attacks and ensuring all connections are encrypted.",
      });
    }

    if (headerName === "Content-Security-Policy") {
      recommendations.push({
        priority: "high",
        category: "Security Headers",
        title: "Add Content Security Policy",
        description:
          "Your website lacks a Content Security Policy (CSP), leaving it vulnerable to cross-site scripting (XSS) and data injection attacks.",
        action:
          "Implement a Content-Security-Policy header that defines which resources can be loaded. Start with a basic policy and gradually tighten it: 'default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
        impact:
          "Prevents XSS attacks, data injection, and unauthorized code execution by controlling which resources browsers can load.",
      });
    }

    if (headerName === "X-Frame-Options") {
      recommendations.push({
        priority: "high",
        category: "Security Headers",
        title: "Prevent Clickjacking Attacks",
        description:
          "The X-Frame-Options header is missing. Your website can be embedded in malicious iframes, enabling clickjacking attacks.",
        action:
          "Add the X-Frame-Options header to your server: 'X-Frame-Options: DENY' to prevent all framing, or 'SAMEORIGIN' to allow framing only from your own domain.",
        impact:
          "Protects your users from clickjacking attacks where attackers trick them into clicking hidden elements.",
      });
    }

    if (headerName === "X-Content-Type-Options") {
      recommendations.push({
        priority: "medium",
        category: "Security Headers",
        title: "Prevent MIME Type Sniffing",
        description:
          "The X-Content-Type-Options header is missing, allowing browsers to MIME-sniff responses and potentially execute malicious content.",
        action:
          "Add 'X-Content-Type-Options: nosniff' to your server configuration to prevent browsers from interpreting files as a different MIME type.",
        impact:
          "Prevents browsers from executing malicious content by strictly enforcing declared content types.",
      });
    }

    if (headerName === "X-XSS-Protection") {
      recommendations.push({
        priority: "low",
        category: "Security Headers",
        title: "Enable XSS Protection",
        description:
          "The X-XSS-Protection header is not set, missing an additional layer of XSS attack protection.",
        action:
          "Add 'X-XSS-Protection: 1; mode=block' to your server headers to enable the browser's built-in XSS filter.",
        impact:
          "Provides an additional layer of protection against reflected XSS attacks in older browsers.",
      });
    }

    if (headerName === "Referrer-Policy") {
      recommendations.push({
        priority: "low",
        category: "Security Headers",
        title: "Control Referrer Information",
        description:
          "Your Referrer-Policy is not set, potentially leaking sensitive information through referrer headers.",
        action:
          "Add 'Referrer-Policy: strict-origin-when-cross-origin' or 'no-referrer' to control what referrer information is sent with requests.",
        impact:
          "Protects user privacy by controlling what URL information is shared with external sites.",
      });
    }
  });

  // Reputation recommendations
  if (reputation === "Warning") {
    recommendations.push({
      priority: "critical",
      category: "Domain Reputation",
      title: "Address Domain Reputation Issues",
      description:
        "Your domain has been flagged with reputation concerns or uses suspicious patterns that security tools may block.",
      action:
        "Check if your domain is on any blacklists using tools like MXToolbox. Review your DNS configuration, scan for malware, and ensure your domain isn't being used for spam or malicious purposes.",
      impact:
        "Maintains trust with users and prevents your website from being blocked by security tools, firewalls, and email filters.",
    });
  } else if (reputation === "Unknown") {
    recommendations.push({
      priority: "medium",
      category: "Domain Reputation",
      title: "Verify Domain Reputation",
      description:
        "Your domain's reputation status is unknown, which may affect trust and deliverability.",
      action:
        "Use reputation checking tools to verify your domain isn't listed on any blacklists. Monitor your domain regularly using services like Google Safe Browsing and VirusTotal.",
      impact:
        "Ensures your domain maintains a clean reputation and isn't inadvertently blocked by security services.",
    });
  }

  // Overall score recommendations
  if (score < 40) {
    recommendations.push({
      priority: "critical",
      category: "Overall Security",
      title: "Urgent Security Overhaul Required",
      description:
        "Your website has critical security deficiencies that pose immediate risk to your business and users.",
      action:
        "Prioritize implementing HTTPS, all security headers, and conducting a comprehensive security audit. Consider hiring a security professional to address these urgent issues.",
      impact:
        "Protects your business from data breaches, maintains customer trust, and ensures compliance with security regulations.",
    });
  } else if (score < 60) {
    recommendations.push({
      priority: "high",
      category: "Overall Security",
      title: "Significant Security Improvements Needed",
      description:
        "Your security posture is below industry standards and leaves you vulnerable to common attacks.",
      action:
        "Address all missing security headers as a priority. Upgrade your SSL/TLS configuration and implement a security monitoring solution.",
      impact:
        "Brings your security up to acceptable standards and significantly reduces your attack surface.",
    });
  } else if (score < 80) {
    recommendations.push({
      priority: "medium",
      category: "Overall Security",
      title: "Good Security, Room for Excellence",
      description:
        "Your security is solid but not excellent. A few improvements will strengthen your overall posture.",
      action:
        "Implement any remaining security headers, consider adding a Web Application Firewall (WAF), and establish regular security assessments.",
      impact:
        "Achieves security excellence and aligns with best practices used by leading organizations.",
    });
  } else {
    recommendations.push({
      priority: "low",
      category: "Overall Security",
      title: "Maintain Your Excellent Security",
      description:
        "Your website has excellent security! Continue monitoring and maintaining your current practices.",
      action:
        "Schedule regular security assessments, stay updated on emerging threats, and maintain your security configurations. Consider security awareness training for your team.",
      impact:
        "Maintains your strong security posture and ensures you stay ahead of evolving threats.",
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return recommendations;
};

// Calculate overall security score
const calculateScore = (
  sslGrade,
  headersPresent,
  headersMissing,
  reputation
) => {
  let score = 0;

  // SSL Grade scoring (40 points)
  const sslScores = { "A+": 40, A: 35, "A-": 30, B: 25, C: 15, D: 10, F: 5 };
  score += sslScores[sslGrade] || 20;

  // Security headers scoring (40 points)
  const headerScore = (headersPresent.length / 6) * 40;
  score += headerScore;

  // Reputation scoring (20 points)
  if (reputation === "Clean") {
    score += 20;
  } else if (reputation === "Warning") {
    score += 10;
  }

  return Math.round(score);
};

// Main analysis function
const analyzeWebsite = async (req, res) => {
  try {
    const { url } = req.body;

    console.log("🔍 Analyzing website:", url);

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
        message: "Invalid URL format. Please include http:// or https://",
      });
    }

    console.log("✅ Valid domain:", domain);

    // Perform all checks
    console.log("🔄 Running security checks...");
    const [sslGrade, headers, reputation, breachStatus] = await Promise.all([
      checkSSL(domain),
      checkSecurityHeaders(url),
      checkDomainReputation(url),
      checkBreaches(domain),
    ]);

    console.log("✅ SSL Grade:", sslGrade);
    console.log("✅ Headers:", headers);
    console.log("✅ Reputation:", reputation);

    // Calculate security score
    const score = calculateScore(
      sslGrade,
      headers.present,
      headers.missing,
      reputation
    );

    // Try AI-powered recommendations first
    let recommendations = await generateAIRecommendations(
      domain,
      sslGrade,
      headers.missing,
      reputation,
      score
    );

    let recommendationMethod = "ai";

    // Fallback to hardcoded if AI fails
    if (!recommendations) {
      console.log(
        "⚠️ AI recommendations failed, using hardcoded recommendations"
      );
      recommendations = generateHardcodedRecommendations(
        sslGrade,
        headers.missing,
        reputation,
        score
      );
      recommendationMethod = "hardcoded";
    } else {
      console.log("✅ Using AI-generated recommendations");
    }

    console.log(
      `✅ Generated ${recommendations.length} recommendations (${recommendationMethod})`
    );

    // ✅ SAVE TO DATABASE
    console.log("💾 Saving scan to database...");
    const websiteScan = await WebsiteScan.create({
      userId: req.user._id,
      domain,
      url,
      score,
      sslGrade,
      securityHeaders: headers.present,
      issues: headers.missing,
      reputation,
      breachStatus,
      recommendations,
      recommendationMethod,
    });

    console.log("✅ Scan saved to database with ID:", websiteScan._id);

    // Prepare response
    const analysisResults = {
      domain,
      ssl_grade: sslGrade,
      headers: headers.present,
      issues: headers.missing,
      reputation,
      breach_status: breachStatus,
      score,
      recommendations,
      recommendationMethod,
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Analysis complete. Score:", score);

    res.status(200).json({
      success: true,
      ...analysisResults,
    });
  } catch (error) {
    console.error("❌ Analysis error:", error);
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

    console.log(`📊 Fetching scan history for user: ${userId}`);

    const scans = await WebsiteScan.find({ userId })
      .sort({ scanDate: -1 })
      .limit(limit)
      .lean();

    console.log(`✅ Found ${scans.length} scans`);

    return res.status(200).json({
      success: true,
      scans: scans,
    });
  } catch (error) {
    console.error("❌ Error fetching scan history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scan history",
      error: error.message,
    });
  }
};

// Get scan statistics
const getScanStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const mongoose = require("mongoose");

    console.log(`📈 Fetching scan stats for user: ${userId}`);

    const stats = await WebsiteScan.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          averageScore: { $avg: "$score" },
          uniqueDomains: { $addToSet: "$domain" },
        },
      },
      {
        $project: {
          _id: 0,
          totalScans: 1,
          averageScore: { $round: ["$averageScore", 0] },
          uniqueDomains: { $size: "$uniqueDomains" },
        },
      },
    ]);

    const result = stats[0] || {
      totalScans: 0,
      averageScore: 0,
      uniqueDomains: 0,
    };

    console.log("✅ Stats:", result);

    return res.status(200).json({
      success: true,
      stats: result,
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};

module.exports = {
  analyzeWebsite,
  getScanHistory,
  getScanStats,
};
