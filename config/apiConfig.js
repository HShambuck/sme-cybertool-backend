module.exports = {
  apis: {
    sslLabs: {
      baseUrl: "https://api.ssllabs.com/api/v3",
      timeout: 30000,
      endpoints: {
        analyze: "/analyze",
      },
    },
    securityHeaders: {
      baseUrl: "https://securityheaders.com",
      timeout: 10000,
    },
    googleSafeBrowsing: {
      baseUrl: "https://safebrowsing.googleapis.com/v4",
      apiKey: process.env.GOOGLE_SAFE_BROWSING_API_KEY,
      timeout: 5000,
    },
    urlscan: {
      baseUrl: "https://urlscan.io/api/v1",
      apiKey: process.env.URLSCAN_API_KEY,
      timeout: 10000,
    },
    phishtank: {
      baseUrl: "https://checkurl.phishtank.com/checkurl/",
      timeout: 5000,
    },
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};

// ============================================
// HOW TO GET API KEYS
// ============================================

/*

1. GOOGLE SAFE BROWSING API (FREE)
   - Go to: https://console.cloud.google.com/
   - Create a new project
   - Enable "Safe Browsing API"
   - Create credentials (API Key)
   - Copy the API key to your .env file

2. HAVEIBEENPWNED API (PAID - $3.50/month)
   - Go to: https://haveibeenpwned.com/API/Key
   - Subscribe to get an API key
   - Copy the API key to your .env file
   - Worth it for professional breach monitoring

3. SHODAN API (OPTIONAL)
   - Free tier: 100 queries/month
   - Go to: https://account.shodan.io/
   - Create account and get API key
   - Paid plans available for more queries

4. SSL LABS API (FREE)
   - No API key required!
   - Just use the public endpoint
   - Rate limited but sufficient for SME use

*/
