const userService = require("../services/user.service");

/**
 * Middleware to validate API key
 */
async function requireApiKey(req, res, next) {
  try {
    // Support multiple authentication methods
    let apiKey = req.headers["x-api-key"] || req.query.apiKey;

    // Also support Authorization: Bearer token
    if (!apiKey && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error:
          "API key required. Provide via X-API-Key header, Authorization: Bearer header, or apiKey query parameter",
      });
    }

    const user = await userService.validateApiKey(apiKey);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication error",
    });
  }
}

/**
 * Middleware to validate admin key
 */
function requireAdminKey(req, res, next) {
  const adminKey = req.headers["x-admin-key"] || req.query.adminKey;
  const { ADMIN_KEY } = require("../config/environment");

  if (!adminKey || adminKey !== ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing admin key",
    });
  }

  next();
}

module.exports = {
  requireApiKey,
  requireAdminKey,
};
