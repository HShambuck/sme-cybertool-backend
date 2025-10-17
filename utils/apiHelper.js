const axios = require("axios");
const { apis } = require("../config/apiConfig");

class ApiHelper {
  // Google Safe Browsing API integration
  static async checkUrlSafeBrowsing(url) {
    if (!apis.googleSafeBrowsing.apiKey) {
      console.warn("Google Safe Browsing API key not configured");
      return null;
    }

    try {
      const response = await axios.post(
        `${apis.googleSafeBrowsing.baseUrl}/threatMatches:find?key=${apis.googleSafeBrowsing.apiKey}`,
        {
          client: {
            clientId: "sme-cybertool",
            clientVersion: "1.0.0",
          },
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
        { timeout: apis.googleSafeBrowsing.timeout }
      );

      if (response.data.matches && response.data.matches.length > 0) {
        return "Warning";
      }
      return "Clean";
    } catch (error) {
      console.error("Safe Browsing API error:", error.message);
      return null;
    }
  }

  // URLScan.io API integration (FREE ALTERNATIVE)
  static async checkUrlScan(url) {
    if (!apis.urlscan.apiKey) {
      console.warn("URLScan.io API key not configured");
      return { verdict: "Unknown", threats: [] };
    }

    try {
      // Submit URL for scanning
      const submitResponse = await axios.post(
        `${apis.urlscan.baseUrl}/scan/`,
        {
          url: url,
          visibility: "unlisted",
        },
        {
          headers: {
            "API-Key": apis.urlscan.apiKey,
            "Content-Type": "application/json",
          },
          timeout: apis.urlscan.timeout,
        }
      );

      const scanId = submitResponse.data.uuid;

      // Wait for scan to complete (usually takes 10-15 seconds)
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // Get scan results
      const resultResponse = await axios.get(
        `${apis.urlscan.baseUrl}/result/${scanId}/`,
        { timeout: apis.urlscan.timeout }
      );

      const data = resultResponse.data;
      const threats = [];

      // Check verdicts
      if (data.verdicts) {
        if (data.verdicts.overall.malicious) {
          threats.push("Malicious content detected");
        }
        if (data.verdicts.urlscan.malicious) {
          threats.push("URL flagged as malicious");
        }
        if (data.verdicts.engines?.malicious > 0) {
          threats.push(
            `${data.verdicts.engines.malicious} security engines flagged this URL`
          );
        }
      }

      return {
        verdict: threats.length > 0 ? "Warning" : "Clean",
        threats: threats,
        score: data.verdicts?.overall?.score || 0,
      };
    } catch (error) {
      console.error("URLScan.io API error:", error.message);
      return { verdict: "Unknown", threats: [] };
    }
  }

  // PhishTank API (FREE - No API key needed for checks)
  static async checkPhishTank(url) {
    try {
      const encodedUrl = encodeURIComponent(url);
      const response = await axios.post(
        apis.phishtank.baseUrl,
        `url=${encodedUrl}&format=json`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: apis.phishtank.timeout,
        }
      );

      if (response.data.results.in_database) {
        return {
          isPhishing: response.data.results.valid,
          details: "URL found in PhishTank database",
        };
      }

      return {
        isPhishing: false,
        details: "URL not found in PhishTank database",
      };
    } catch (error) {
      console.error("PhishTank API error:", error.message);
      return {
        isPhishing: false,
        details: "Unable to verify",
      };
    }
  }

  // VirusTotal Public API (FREE - 4 requests per minute)
  static async checkVirusTotal(url) {
    // Note: Requires API key but has generous free tier
    // Implementation similar to above if you want to add it
    return { clean: true, detections: 0 };
  }

  // Combined threat check using multiple free sources
  static async checkThreats(url) {
    try {
      // Run checks in parallel for speed
      const [phishTankResult, urlScanResult, safeBrowsingResult] =
        await Promise.allSettled([
          this.checkPhishTank(url),
          this.checkUrlScan(url),
          this.checkUrlSafeBrowsing(url),
        ]);

      const threats = [];
      let overallVerdict = "Clean";

      // Process PhishTank
      if (
        phishTankResult.status === "fulfilled" &&
        phishTankResult.value.isPhishing
      ) {
        threats.push("Phishing site detected");
        overallVerdict = "Warning";
      }

      // Process URLScan
      if (
        urlScanResult.status === "fulfilled" &&
        urlScanResult.value.verdict === "Warning"
      ) {
        threats.push(...urlScanResult.value.threats);
        overallVerdict = "Warning";
      }

      // Process Safe Browsing
      if (
        safeBrowsingResult.status === "fulfilled" &&
        safeBrowsingResult.value === "Warning"
      ) {
        threats.push("Flagged by Google Safe Browsing");
        overallVerdict = "Warning";
      }

      return {
        verdict: overallVerdict,
        threats: threats.length > 0 ? threats : ["No threats detected"],
        checkedSources: ["PhishTank", "URLScan.io", "Google Safe Browsing"],
      };
    } catch (error) {
      console.error("Threat check error:", error.message);
      return {
        verdict: "Unknown",
        threats: ["Unable to complete threat analysis"],
        checkedSources: [],
      };
    }
  }

  // DNS lookup helper
  static async getDomainIP(domain) {
    const dns = require("dns").promises;
    try {
      const addresses = await dns.resolve4(domain);
      return addresses[0];
    } catch (error) {
      console.error("DNS lookup error:", error.message);
      return null;
    }
  }
}

module.exports = ApiHelper;
