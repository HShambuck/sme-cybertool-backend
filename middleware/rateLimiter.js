const rateLimit = require("express-rate-limit");
const { rateLimit: rateLimitConfig } = require("../config/apiConfig");

const securityAnalysisLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  message: {
    success: false,
    message: "Too many analysis requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Store for distributed systems (use Redis in production)
  // store: new RedisStore({...})
});

module.exports = {
  securityAnalysisLimiter,
};
