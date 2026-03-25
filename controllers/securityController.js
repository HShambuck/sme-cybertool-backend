const axios = require("axios");
const WebsiteScan = require("../models/WebsiteScan");

// ════════════════════════════════════════════════════════════
// UTILITY: Validate URL and extract domain
// ════════════════════════════════════════════════════════════
const validateUrl = (rawUrl) => {
  try {
    const u = new URL(rawUrl);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    return u.hostname;
  } catch {
    return null;
  }
};

// ════════════════════════════════════════════════════════════
// LAYER 0: Reachability — blocks fake/dead URLs immediately
// ════════════════════════════════════════════════════════════
const checkUrlReachable = async (url) => {
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 5,
      validateStatus: (s) => s < 600,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CyberShield-Scanner/1.0)",
      },
    });
    return {
      reachable: true,
      statusCode: res.status,
      headers: res.headers,
      finalUrl: res.request?.res?.responseUrl || url,
      rawBody: typeof res.data === "string" ? res.data.substring(0, 50000) : "",
    };
  } catch (err) {
    const reason =
      err.code === "ENOTFOUND"
        ? "Domain does not exist (DNS lookup failed)"
        : err.code === "ECONNREFUSED"
          ? "Connection refused — server not running"
          : err.code === "ECONNABORTED" || err.code === "ETIMEDOUT"
            ? "Connection timed out"
            : `Cannot reach URL: ${err.message}`;
    return { reachable: false, reason };
  }
};

// ════════════════════════════════════════════════════════════
// LAYER 1A: Transport Security
// ════════════════════════════════════════════════════════════
const checkTransportSecurity = async (url, domain, responseHeaders) => {
  const findings = [];
  const isHttps = url.startsWith("https://");

  if (!isHttps) {
    findings.push({
      id: "TRANSPORT_001",
      category: "Transport Security",
      type: "confirmed",
      title: "Site Not Using HTTPS",
      severity: "critical",
      confidence: "high",
      evidence: `URL uses HTTP: ${url}`,
      owasp: "A02:2021 – Cryptographic Failures",
      cwe: "CWE-319",
      description:
        "All traffic between users and your server is transmitted unencrypted.",
      recommendation:
        "Install a TLS certificate and redirect all HTTP traffic to HTTPS. Use Let's Encrypt for a free certificate.",
    });

    try {
      const httpCheck = await axios.get(`http://${domain}`, {
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: () => true,
      });
      if (![301, 302, 307, 308].includes(httpCheck.status)) {
        findings.push({
          id: "TRANSPORT_002",
          category: "Transport Security",
          type: "confirmed",
          title: "No HTTP to HTTPS Redirect",
          severity: "high",
          confidence: "high",
          evidence: `HTTP responded with status ${httpCheck.status} instead of a redirect`,
          owasp: "A02:2021 – Cryptographic Failures",
          cwe: "CWE-319",
          description:
            "Users who visit the HTTP version are not automatically redirected to HTTPS.",
          recommendation:
            "Configure a permanent 301 redirect from HTTP to HTTPS at the server or CDN level.",
        });
      }
    } catch {
      /* ignore */
    }
  }

  let sslGrade = "N/A";
  let hasSSL = isHttps;
  try {
    const sslRes = await axios.get(
      `https://api.ssllabs.com/api/v3/analyze?host=${domain}&publish=off&fromCache=on&all=done`,
      { timeout: 15000 },
    );
    if (sslRes.data.status === "READY" && sslRes.data.endpoints?.length) {
      sslGrade = sslRes.data.endpoints[0]?.grade || "T";
      hasSSL = true;
      if (["C", "D", "F", "T"].includes(sslGrade)) {
        findings.push({
          id: "TRANSPORT_003",
          category: "Transport Security",
          type: "confirmed",
          title: `Weak SSL/TLS Configuration (Grade ${sslGrade})`,
          severity: sslGrade === "F" || sslGrade === "T" ? "critical" : "high",
          confidence: "high",
          evidence: `SSL Labs returned grade: ${sslGrade}`,
          owasp: "A02:2021 – Cryptographic Failures",
          cwe: "CWE-326",
          description:
            "Your SSL/TLS configuration uses outdated protocols or weak cipher suites.",
          recommendation:
            "Disable TLS 1.0 and 1.1. Enable TLS 1.3. Remove weak cipher suites.",
        });
      }
    }
  } catch {
    /* SSL Labs unavailable */
  }

  return { findings, sslGrade, hasSSL };
};

// ════════════════════════════════════════════════════════════
// LAYER 1B: Security Headers — 7 headers checked
// ════════════════════════════════════════════════════════════
const checkSecurityHeaders = (responseHeaders = {}) => {
  const findings = [];
  const presentHeaders = [];

  const headerChecks = [
    {
      key: "strict-transport-security",
      label: "Strict-Transport-Security (HSTS)",
      id: "HEADER_001",
      severity: "high",
      owasp: "A05:2021 – Security Misconfiguration",
      cwe: "CWE-319",
      description:
        "HSTS is missing. Browsers may connect over HTTP, enabling SSL stripping attacks.",
      recommendation:
        "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
    },
    {
      key: "content-security-policy",
      label: "Content-Security-Policy (CSP)",
      id: "HEADER_002",
      severity: "high",
      owasp: "A03:2021 – Injection",
      cwe: "CWE-693",
      description:
        "No CSP header found. Your site has no defence against XSS and data injection attacks.",
      recommendation:
        "Define a Content-Security-Policy. Start with: default-src 'self'.",
    },
    {
      key: "x-frame-options",
      label: "X-Frame-Options",
      id: "HEADER_003",
      severity: "high",
      owasp: "A05:2021 – Security Misconfiguration",
      cwe: "CWE-1021",
      description:
        "X-Frame-Options is missing. Your site can be embedded in iframes, enabling clickjacking.",
      recommendation: "Add: X-Frame-Options: DENY",
    },
    {
      key: "x-content-type-options",
      label: "X-Content-Type-Options",
      id: "HEADER_004",
      severity: "medium",
      owasp: "A05:2021 – Security Misconfiguration",
      cwe: "CWE-430",
      description:
        "Missing X-Content-Type-Options allows MIME-type sniffing attacks.",
      recommendation: "Add: X-Content-Type-Options: nosniff",
    },
    {
      key: "referrer-policy",
      label: "Referrer-Policy",
      id: "HEADER_005",
      severity: "low",
      owasp: "A05:2021 – Security Misconfiguration",
      cwe: "CWE-116",
      description:
        "No Referrer-Policy set. Sensitive URL paths may leak to external sites.",
      recommendation: "Add: Referrer-Policy: strict-origin-when-cross-origin",
    },
    {
      key: "permissions-policy",
      label: "Permissions-Policy",
      id: "HEADER_006",
      severity: "low",
      owasp: "A05:2021 – Security Misconfiguration",
      cwe: "CWE-693",
      description:
        "No Permissions-Policy header. Browser features like camera/mic are unrestricted.",
      recommendation:
        "Add: Permissions-Policy: geolocation=(), microphone=(), camera=()",
    },
    {
      key: "x-xss-protection",
      label: "X-XSS-Protection",
      id: "HEADER_007",
      severity: "low",
      owasp: "A03:2021 – Injection",
      cwe: "CWE-693",
      description:
        "X-XSS-Protection not set. Older browsers miss an extra XSS filter layer.",
      recommendation: "Add: X-XSS-Protection: 1; mode=block",
    },
  ];

  for (const check of headerChecks) {
    if (responseHeaders[check.key]) {
      presentHeaders.push(check.label);
    } else {
      findings.push({
        id: check.id,
        category: "Header Security",
        type: "confirmed",
        title: `Missing ${check.label}`,
        severity: check.severity,
        confidence: "high",
        evidence: `Header '${check.key}' not present in HTTP response`,
        owasp: check.owasp,
        cwe: check.cwe,
        description: check.description,
        recommendation: check.recommendation,
      });
    }
  }

  return {
    findings,
    presentHeaders,
    missingHeaders: findings.map((f) => f.title),
  };
};

// ════════════════════════════════════════════════════════════
// LAYER 1C: Cookie Security
// ════════════════════════════════════════════════════════════
const checkCookieSecurity = (responseHeaders = {}) => {
  const findings = [];
  const raw = responseHeaders["set-cookie"];
  if (!raw) return { findings };
  const cookies = Array.isArray(raw) ? raw : [raw];

  for (const cookie of cookies) {
    const name = cookie.split("=")[0].trim();
    const lower = cookie.toLowerCase();

    if (!lower.includes("httponly")) {
      findings.push({
        id: "COOKIE_001",
        category: "Application Security",
        type: "confirmed",
        title: `Cookie '${name}' Missing HttpOnly Flag`,
        severity: "medium",
        confidence: "high",
        evidence: `Set-Cookie: ${cookie.substring(0, 80)}`,
        owasp: "A05:2021 – Security Misconfiguration",
        cwe: "CWE-1004",
        description: `The cookie '${name}' is accessible via JavaScript. XSS attacks could steal session tokens.`,
        recommendation:
          "Add the HttpOnly flag to all session and authentication cookies.",
      });
    }
    if (!lower.includes("secure")) {
      findings.push({
        id: "COOKIE_002",
        category: "Application Security",
        type: "confirmed",
        title: `Cookie '${name}' Missing Secure Flag`,
        severity: "medium",
        confidence: "high",
        evidence: `Set-Cookie: ${cookie.substring(0, 80)}`,
        owasp: "A02:2021 – Cryptographic Failures",
        cwe: "CWE-614",
        description: `Cookie '${name}' can be transmitted over unencrypted HTTP connections.`,
        recommendation:
          "Add the Secure flag to ensure cookies are only sent over HTTPS.",
      });
    }
    if (!lower.includes("samesite")) {
      findings.push({
        id: "COOKIE_003",
        category: "Application Security",
        type: "posture",
        title: `Cookie '${name}' Missing SameSite Attribute`,
        severity: "low",
        confidence: "high",
        evidence: `Set-Cookie: ${cookie.substring(0, 80)}`,
        owasp: "A01:2021 – Broken Access Control",
        cwe: "CWE-352",
        description: `Cookie '${name}' has no SameSite attribute, increasing CSRF risk.`,
        recommendation:
          "Set SameSite=Strict or SameSite=Lax depending on your requirements.",
      });
    }
  }

  return { findings };
};

// ════════════════════════════════════════════════════════════
// LAYER 2: Technology Fingerprinting + CVE mapping
// ════════════════════════════════════════════════════════════
const fingerprintTechnology = (responseHeaders = {}, htmlBody = "") => {
  const detectedTech = [];
  const findings = [];

  const server = responseHeaders["server"] || "";
  const poweredBy = responseHeaders["x-powered-by"] || "";

  if (server && server.toLowerCase() !== "cloudflare" && server.length > 2) {
    detectedTech.push({ name: "Server", version: server });
    findings.push({
      id: "TECH_001",
      category: "Infrastructure Exposure",
      type: "posture",
      title: "Server Version Disclosed in Headers",
      severity: "low",
      confidence: "high",
      evidence: `Server: ${server}`,
      owasp: "A05:2021 – Security Misconfiguration",
      cwe: "CWE-200",
      description:
        "Your server discloses its software name and version, aiding attackers in targeting known vulnerabilities.",
      recommendation:
        "Suppress the Server header or replace it with a generic value.",
    });
  }

  if (poweredBy) {
    detectedTech.push({ name: "Backend", version: poweredBy });
    findings.push({
      id: "TECH_002",
      category: "Infrastructure Exposure",
      type: "posture",
      title: "Backend Technology Disclosed (X-Powered-By)",
      severity: "low",
      confidence: "high",
      evidence: `X-Powered-By: ${poweredBy}`,
      owasp: "A05:2021 – Security Misconfiguration",
      cwe: "CWE-200",
      description:
        "The X-Powered-By header reveals your backend language/framework.",
      recommendation:
        "Remove the X-Powered-By header in your server configuration.",
    });
  }

  if (htmlBody.includes("/wp-content/") || htmlBody.includes("/wp-includes/")) {
    const wpVersion = htmlBody.match(/WordPress\s+([\d.]+)/i)?.[1];
    detectedTech.push({ name: "WordPress", version: wpVersion || "Unknown" });
    findings.push({
      id: "TECH_003",
      category: "Technology Risk",
      type: wpVersion ? "confirmed" : "posture",
      title: wpVersion
        ? `WordPress ${wpVersion} Detected`
        : "WordPress CMS Detected",
      severity: wpVersion ? "medium" : "low",
      confidence: "high",
      evidence: wpVersion
        ? `WordPress version ${wpVersion} in page source`
        : "wp-content/wp-includes paths found",
      owasp: "A06:2021 – Vulnerable and Outdated Components",
      cwe: "CWE-1035",
      description: wpVersion
        ? `WordPress ${wpVersion} is publicly visible. Outdated versions have known CVEs.`
        : "WordPress CMS detected. Ensure it is regularly updated.",
      recommendation: wpVersion
        ? "Update WordPress to the latest version and remove the generator meta tag."
        : "Enable automatic updates and audit all active plugins.",
    });
  }

  const jqMatch = htmlBody.match(/jquery[.-]([\d.]+)(\.min)?\.js/i);
  if (jqMatch) {
    const jqv = jqMatch[1];
    detectedTech.push({ name: "jQuery", version: jqv });
    const [major, minor] = jqv.split(".").map(Number);
    if (major < 3 || (major === 3 && minor < 5)) {
      findings.push({
        id: "TECH_004",
        category: "Technology Risk",
        type: "confirmed",
        title: `Outdated jQuery ${jqv} — Known XSS CVEs`,
        severity: "medium",
        confidence: "high",
        evidence: `jquery-${jqv}.min.js loaded in page`,
        owasp: "A06:2021 – Vulnerable and Outdated Components",
        cwe: "CWE-1035",
        cveSample: "CVE-2020-11022, CVE-2020-11023",
        description: `jQuery ${jqv} has known XSS vulnerabilities. Version 3.5+ is required.`,
        recommendation: "Upgrade jQuery to 3.7.x or later.",
      });
    }
  }

  const phpVersion = poweredBy.match(/php\/([\d.]+)/i)?.[1];
  if (phpVersion) {
    detectedTech.push({ name: "PHP", version: phpVersion });
    const [major] = phpVersion.split(".").map(Number);
    if (major < 8) {
      findings.push({
        id: "TECH_005",
        category: "Technology Risk",
        type: "confirmed",
        title: `End-of-Life PHP ${phpVersion} Detected`,
        severity: "high",
        confidence: "high",
        evidence: `X-Powered-By: PHP/${phpVersion}`,
        owasp: "A06:2021 – Vulnerable and Outdated Components",
        cwe: "CWE-1035",
        description: `PHP ${phpVersion} is end-of-life and receives no security patches.`,
        recommendation: "Upgrade to PHP 8.2 or later immediately.",
      });
    }
  }

  if (htmlBody.includes("Index of /.git") || htmlBody.includes("[DIR] .git")) {
    findings.push({
      id: "TECH_006",
      category: "Infrastructure Exposure",
      type: "confirmed",
      title: "Exposed .git Directory",
      severity: "critical",
      confidence: "high",
      evidence: "Directory listing of .git found in page response",
      owasp: "A05:2021 – Security Misconfiguration",
      cwe: "CWE-548",
      description:
        "Your .git directory is publicly accessible — attackers can download your full source code and secrets.",
      recommendation:
        "Block .git access in your server config immediately and rotate any exposed credentials.",
    });
  }

  return { findings, detectedTech };
};

// ════════════════════════════════════════════════════════════
// LAYER 3: CORS Misconfiguration
// ════════════════════════════════════════════════════════════
const checkCORS = async (url) => {
  const findings = [];
  try {
    const res = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true,
      headers: {
        Origin: "https://evil-attacker.com",
        "User-Agent": "Mozilla/5.0 (compatible; CyberShield-Scanner/1.0)",
      },
    });

    const acao = res.headers["access-control-allow-origin"];
    const acac = res.headers["access-control-allow-credentials"];

    if (acao === "*") {
      findings.push({
        id: "CORS_001",
        category: "Application Security",
        type: "probable",
        title: "Wildcard CORS Policy (*)",
        severity: "medium",
        confidence: "high",
        evidence: "Access-Control-Allow-Origin: *",
        owasp: "A05:2021 – Security Misconfiguration",
        cwe: "CWE-942",
        description:
          "Your CORS policy allows any website to make cross-origin requests.",
        recommendation: "Restrict CORS to specific trusted origins.",
      });
    } else if (acao === "https://evil-attacker.com") {
      findings.push({
        id: "CORS_002",
        category: "Application Security",
        type: "confirmed",
        title: "CORS Policy Reflects Arbitrary Origins",
        severity: "high",
        confidence: "high",
        evidence: `ACAO: ${acao} (reflected test origin)`,
        owasp: "A05:2021 – Security Misconfiguration",
        cwe: "CWE-942",
        description:
          "Your server reflects any Origin header back without validation.",
        recommendation: "Maintain an explicit allowlist of trusted origins.",
      });

      if (acac === "true") {
        findings.push({
          id: "CORS_003",
          category: "Application Security",
          type: "confirmed",
          title: "Critical: CORS Reflects Origin + Allows Credentials",
          severity: "critical",
          confidence: "high",
          evidence: `ACAO: ${acao} + ACAC: true`,
          owasp: "A01:2021 – Broken Access Control",
          cwe: "CWE-942",
          description:
            "Attackers can make fully authenticated requests on behalf of logged-in users from any domain.",
          recommendation:
            "Immediately restrict allowed origins and remove allow-credentials for untrusted origins.",
        });
      }
    }
  } catch {
    /* ignore */
  }

  return { findings };
};

// ════════════════════════════════════════════════════════════
// LAYER 4A: Google Safe Browsing
// ════════════════════════════════════════════════════════════
const checkGoogleSafeBrowsing = async (url) => {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return { safe: true, threats: [], source: "skipped" };

  try {
    const res = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        client: { clientId: "cybershield-sme", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      },
      { timeout: 5000 },
    );

    const matches = res.data.matches || [];
    return matches.length
      ? {
          safe: false,
          threats: matches.map((m) => m.threatType),
          source: "google_safe_browsing",
        }
      : { safe: true, threats: [], source: "google_safe_browsing" };
  } catch (err) {
    console.error("Google Safe Browsing error:", err.message);
    return { safe: true, threats: [], source: "gsb_error" };
  }
};

// ════════════════════════════════════════════════════════════
// LAYER 4B: URLScan.io
// ════════════════════════════════════════════════════════════
const checkUrlScan = async (url) => {
  const apiKey = process.env.URLSCAN_API_KEY;
  if (!apiKey)
    return { verdict: "unknown", malicious: false, source: "skipped" };

  try {
    const submit = await axios.post(
      "https://urlscan.io/api/v1/scan/",
      { url, visibility: "private" },
      {
        headers: { "API-Key": apiKey, "Content-Type": "application/json" },
        timeout: 10000,
      },
    );
    const uuid = submit.data.uuid;
    if (!uuid)
      return {
        verdict: "unknown",
        malicious: false,
        source: "urlscan_no_uuid",
      };

    await new Promise((r) => setTimeout(r, 12000));

    const result = await axios.get(
      `https://urlscan.io/api/v1/result/${uuid}/`,
      { timeout: 10000 },
    );
    const v = result.data.verdicts?.overall;
    return {
      verdict: v?.score > 50 ? "suspicious" : "clean",
      malicious: v?.malicious || false,
      score: v?.score || 0,
      source: "urlscan",
    };
  } catch (err) {
    console.error("URLScan error:", err.message);
    return { verdict: "unknown", malicious: false, source: "urlscan_error" };
  }
};

// ════════════════════════════════════════════════════════════
// LAYER 5: Reputation signals
// ════════════════════════════════════════════════════════════
const deriveReputation = (safeBrowsing, urlscan) => {
  if (!safeBrowsing.safe || urlscan.malicious) return "Warning";
  if (urlscan.verdict === "suspicious") return "Warning";
  if (safeBrowsing.source === "skipped" && urlscan.source === "skipped")
    return "Unknown";
  return "Clean";
};

const buildReputationFindings = (safeBrowsing, urlscan) => {
  const findings = [];
  if (!safeBrowsing.safe) {
    findings.push({
      id: "REP_001",
      category: "Threat Reputation",
      type: "confirmed",
      title: `Flagged by Google Safe Browsing: ${safeBrowsing.threats.join(", ")}`,
      severity: "critical",
      confidence: "high",
      evidence: `Threat types: ${safeBrowsing.threats.join(", ")}`,
      owasp: "A09:2021 – Security Logging and Monitoring Failures",
      cwe: "CWE-693",
      description:
        "Your domain is on Google's threat database. Users see browser warnings.",
      recommendation:
        "Use Google Search Console to request a security review after resolving flagged content.",
    });
  }
  if (urlscan.malicious || urlscan.verdict === "suspicious") {
    findings.push({
      id: "REP_002",
      category: "Threat Reputation",
      type: "probable",
      title: "Suspicious Behaviour Detected by URLScan",
      severity: "high",
      confidence: "medium",
      evidence: `URLScan verdict: ${urlscan.verdict}, score: ${urlscan.score}`,
      owasp: "A09:2021 – Security Logging and Monitoring Failures",
      cwe: "CWE-693",
      description:
        "URLScan flagged suspicious page behaviour or redirect patterns.",
      recommendation:
        "Audit all third-party scripts and remove unauthorized external resources.",
    });
  }
  return { findings };
};

// ════════════════════════════════════════════════════════════
// SCORING ENGINE
// Transport(20) Headers(15) AppSec(25) TechRisk(15)
// Infra(10) Reputation(10) Config(5)
// ════════════════════════════════════════════════════════════
const calculateScore = (
  allFindings,
  sslGrade,
  hasSSL,
  headerData,
  reputation,
) => {
  const breakdown = {
    transportSecurity: 0,
    headerSecurity: 0,
    applicationSecurity: 0,
    technologyRisk: 0,
    infrastructureExposure: 0,
    threatReputation: 0,
    configurationHygiene: 0,
  };

  if (hasSSL) {
    const pts = { "A+": 20, A: 17, "A-": 15, B: 12, C: 8, D: 4, F: 1, T: 2 };
    breakdown.transportSecurity = pts[sslGrade] ?? 10;
  }

  breakdown.headerSecurity = Math.round(
    (headerData.presentHeaders.length / 7) * 15,
  );

  const deduct = (findings, map) =>
    findings.reduce((s, f) => s + (map[f.severity] || 0), 0);

  breakdown.applicationSecurity = Math.max(
    0,
    25 -
      deduct(
        allFindings.filter((f) => f.category === "Application Security"),
        { critical: 12, high: 8, medium: 4, low: 2 },
      ),
  );

  breakdown.technologyRisk = Math.max(
    0,
    15 -
      deduct(
        allFindings.filter((f) => f.category === "Technology Risk"),
        { critical: 8, high: 6, medium: 3, low: 1 },
      ),
  );

  breakdown.infrastructureExposure = Math.max(
    0,
    10 -
      deduct(
        allFindings.filter((f) => f.category === "Infrastructure Exposure"),
        { critical: 6, high: 4, medium: 2, low: 1 },
      ),
  );

  breakdown.threatReputation =
    reputation === "Clean" ? 10 : reputation === "Unknown" ? 5 : 0;

  const postureCount = allFindings.filter((f) => f.type === "posture").length;
  breakdown.configurationHygiene = Math.max(0, 5 - postureCount);

  const total = Math.min(
    100,
    Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0)),
  );
  return { total, breakdown };
};

const getSecurityLevel = (score) => {
  if (score >= 80) return { label: "Secure", color: "green" };
  if (score >= 60) return { label: "Moderately Secure", color: "yellow" };
  if (score >= 40) return { label: "At Risk", color: "orange" };
  return { label: "Highly Vulnerable", color: "red" };
};

// ════════════════════════════════════════════════════════════
// AI RECOMMENDATIONS via Groq
// ════════════════════════════════════════════════════════════
const generateAIRecommendations = async (
  domain,
  scoreData,
  allFindings,
  reputation,
) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  if (!apiKey) return null;

  const topFindings = allFindings
    .filter((f) => ["critical", "high"].includes(f.severity))
    .slice(0, 8)
    .map((f) => `[${f.severity.toUpperCase()}] ${f.title} — ${f.description}`)
    .join("\n");

  const context = `
Domain: ${domain}
Score: ${scoreData.total}/100 (${getSecurityLevel(scoreData.total).label})
Breakdown: Transport ${scoreData.breakdown.transportSecurity}/20 | Headers ${scoreData.breakdown.headerSecurity}/15 | AppSec ${scoreData.breakdown.applicationSecurity}/25 | TechRisk ${scoreData.breakdown.technologyRisk}/15 | Infra ${scoreData.breakdown.infrastructureExposure}/10 | Reputation ${scoreData.breakdown.threatReputation}/10 | Config ${scoreData.breakdown.configurationHygiene}/5
Reputation: ${reputation}
Critical/High Findings:
${topFindings || "None"}
  `.trim();

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        max_completion_tokens: 1800,
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content: `You are a concise cybersecurity expert for SMEs.
Return ONLY a valid JSON array of 4–6 recommendations. No markdown, no preamble, no backticks.
Each item: { priority (critical|high|medium|low), category, title, description, action, impact }
Use second-person. Be specific and actionable.`,
          },
          {
            role: "user",
            content: `Recommendations for this assessment:\n\n${context}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 25000,
      },
    );

    const raw = res.data?.choices?.[0]?.message?.content || "";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const valid = parsed.filter(
      (r) => r.priority && r.title && r.description && r.action && r.impact,
    );
    return valid.length ? valid : null;
  } catch (err) {
    console.error("Groq AI recommendations error:", err.message);
    return null;
  }
};

// ════════════════════════════════════════════════════════════
// FALLBACK RECOMMENDATIONS — built from actual findings
// ════════════════════════════════════════════════════════════
const generateFallbackRecommendations = (allFindings) => {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return allFindings
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, 6)
    .map((f) => ({
      priority: f.severity,
      category: f.category,
      title: f.title,
      description: f.description,
      action: f.recommendation,
      impact: `Addresses ${f.owasp}${f.cwe ? ` (${f.cwe})` : ""}.`,
    }));
};

// ════════════════════════════════════════════════════════════
// MAIN: analyzeWebsite
// ════════════════════════════════════════════════════════════
const analyzeWebsite = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url)
      return res
        .status(400)
        .json({ success: false, message: "URL is required" });

    const domain = validateUrl(url);
    if (!domain)
      return res.status(400).json({
        success: false,
        message: "Invalid URL format. Please include http:// or https://",
      });

    console.log(`🔍 Starting full scan: ${url}`);

    // Layer 0 — Reachability gate
    const reachability = await checkUrlReachable(url);
    if (!reachability.reachable) {
      return res.status(422).json({
        success: false,
        message: `Cannot scan this URL: ${reachability.reason}`,
        code: "URL_UNREACHABLE",
      });
    }

    console.log(
      `✅ Reachable (${reachability.statusCode}) — running all scan layers...`,
    );

    // Layers 1–4 in parallel
    const [transportResult, corsResult, safeBrowsing, urlscanResult] =
      await Promise.all([
        checkTransportSecurity(url, domain, reachability.headers),
        checkCORS(url),
        checkGoogleSafeBrowsing(url),
        checkUrlScan(url),
      ]);

    // Layers using already-fetched response
    const headerResult = checkSecurityHeaders(reachability.headers);
    const cookieResult = checkCookieSecurity(reachability.headers);
    const techResult = fingerprintTechnology(
      reachability.headers,
      reachability.rawBody,
    );
    const reputation = deriveReputation(safeBrowsing, urlscanResult);
    const reputationResult = buildReputationFindings(
      safeBrowsing,
      urlscanResult,
    );

    // Aggregate all findings
    const allFindings = [
      ...transportResult.findings,
      ...headerResult.findings,
      ...cookieResult.findings,
      ...techResult.findings,
      ...corsResult.findings,
      ...reputationResult.findings,
    ];

    const scoreData = calculateScore(
      allFindings,
      transportResult.sslGrade,
      transportResult.hasSSL,
      headerResult,
      reputation,
    );
    const securityLevel = getSecurityLevel(scoreData.total);

    console.log(
      `📊 Score: ${scoreData.total} — ${securityLevel.label} | Findings: ${allFindings.length}`,
    );

    // AI recommendations with Groq fallback
    let recommendations = await generateAIRecommendations(
      domain,
      scoreData,
      allFindings,
      reputation,
    );
    let recommendationMethod = "ai";
    if (!recommendations?.length) {
      recommendations = generateFallbackRecommendations(allFindings);
      recommendationMethod = "hardcoded";
    }

    const breachStatus = safeBrowsing.threats.length
      ? `Flagged: ${safeBrowsing.threats.join(", ")}`
      : "No threats detected in reputation databases";

    // Save to DB
    const scan = await WebsiteScan.create({
      userId: req.user._id,
      domain,
      url,
      score: scoreData.total,
      sslGrade: transportResult.sslGrade,
      securityLevel: securityLevel.label,
      scoreBreakdown: scoreData.breakdown,
      securityHeaders: headerResult.presentHeaders,
      issues: headerResult.missingHeaders,
      reputation,
      breachStatus,
      detectedTech: techResult.detectedTech,
      findings: allFindings,
      findingSummary: {
        total: allFindings.length,
        confirmed: allFindings.filter((f) => f.type === "confirmed").length,
        probable: allFindings.filter((f) => f.type === "probable").length,
        posture: allFindings.filter((f) => f.type === "posture").length,
        bySeverity: {
          critical: allFindings.filter((f) => f.severity === "critical").length,
          high: allFindings.filter((f) => f.severity === "high").length,
          medium: allFindings.filter((f) => f.severity === "medium").length,
          low: allFindings.filter((f) => f.severity === "low").length,
        },
      },
      recommendations,
      recommendationMethod,
    });

    console.log(`💾 Scan saved: ${scan._id}`);

    return res.status(200).json({
      success: true,
      domain,
      score: scoreData.total,
      scoreBreakdown: scoreData.breakdown,
      securityLevel: securityLevel.label,
      ssl_grade: transportResult.sslGrade,
      headers: headerResult.presentHeaders,
      issues: headerResult.missingHeaders,
      reputation,
      breach_status: breachStatus,
      detectedTech: techResult.detectedTech,
      findings: allFindings,
      findingSummary: {
        total: allFindings.length,
        confirmed: allFindings.filter((f) => f.type === "confirmed").length,
        probable: allFindings.filter((f) => f.type === "probable").length,
        posture: allFindings.filter((f) => f.type === "posture").length,
        bySeverity: {
          critical: allFindings.filter((f) => f.severity === "critical").length,
          high: allFindings.filter((f) => f.severity === "high").length,
          medium: allFindings.filter((f) => f.severity === "medium").length,
          low: allFindings.filter((f) => f.severity === "low").length,
        },
      },
      recommendations,
      recommendationMethod,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ analyzeWebsite error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze website",
      error: err.message,
    });
  }
};

// ════════════════════════════════════════════════════════════
const getScanHistory = async (req, res) => {
  try {
    const scans = await WebsiteScan.find({ userId: req.user._id })
      .sort({ scanDate: -1 })
      .limit(parseInt(req.query.limit) || 20)
      .lean();
    return res.status(200).json({ success: true, scans });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch scan history" });
  }
};

const getScanStats = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const stats = await WebsiteScan.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user._id) } },
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
    return res.status(200).json({
      success: true,
      stats: stats[0] || { totalScans: 0, averageScore: 0, uniqueDomains: 0 },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch statistics" });
  }
};

module.exports = { analyzeWebsite, getScanHistory, getScanStats };
