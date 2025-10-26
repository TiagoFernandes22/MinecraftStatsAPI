const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const {
  requireApiKey,
  requireAdminKey,
} = require("./middleware/auth.middleware");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error.middleware");
const {
  apiLimiter,
  uploadLimiter,
  adminLimiter,
  mojangLimiter,
} = require("./middleware/rate-limit.middleware");

// Import routes
const statsRoutes = require("./routes/stats.routes");
const playerRoutes = require("./routes/player.routes");
const worldRoutes = require("./routes/world.routes");
const adminRoutes = require("./routes/admin.routes");
const cacheRoutes = require("./routes/cache.routes");
const mojangRoutes = require("./routes/mojang.routes");

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check (no rate limit)
app.get("/health", (req, res) => {
  res.json({ success: true, status: "healthy" });
});

// Get current user info (backward compatibility)
app.get("/api/me", requireApiKey, (req, res) => {
  res.json({
    userId: req.user.userId || req.user.username,
    displayName: req.user.displayName,
  });
});

// API routes with rate limiting
app.use("/api", apiLimiter); // Apply rate limiting to all API routes
app.use("/api", requireApiKey, statsRoutes);
app.use("/api/players", requireApiKey, playerRoutes);
app.use("/api/player", requireApiKey, playerRoutes); // Backward compatibility
app.use("/api/upload", uploadLimiter); // Strict rate limiting for uploads
app.use("/api", requireApiKey, worldRoutes);
app.use("/api/cache", requireApiKey, cacheRoutes);
app.use("/api/mojang", mojangLimiter); // Strict rate limiting for Mojang API
app.use("/api/mojang", requireApiKey, mojangRoutes);

// Admin routes with strict rate limiting
app.use("/admin", adminLimiter);
app.use("/admin", requireAdminKey, adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
