const rateLimit = require("express-rate-limit");

/**
 * Skip rate limiting in test environment
 */
const skipInTest = () => process.env.NODE_ENV === "test";

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests from this IP, please try again later.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * Strict limiter for file uploads
 * 5 uploads per hour per IP
 */
const uploadLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 uploads per hour
  message: {
    success: false,
    error: "Too many upload attempts. Please wait before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many upload attempts. Please wait before trying again.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * Admin endpoint rate limiter
 * 30 requests per 15 minutes per IP
 */
const adminLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 admin requests per windowMs
  message: {
    success: false,
    error: "Too many admin requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many admin requests. Please slow down.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * Mojang API endpoint limiter (external API calls)
 * 20 requests per 5 minutes per IP
 */
const mojangLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 Mojang API calls per 5 minutes
  message: {
    success: false,
    error: "Too many Mojang API requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many Mojang API requests. Please slow down.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

module.exports = {
  apiLimiter,
  uploadLimiter,
  adminLimiter,
  mojangLimiter,
};
