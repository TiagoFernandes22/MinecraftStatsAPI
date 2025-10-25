const express = require("express");
const cors = require("cors");
const {
  requireApiKey,
  requireAdminKey,
} = require("./middleware/auth.middleware");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error.middleware");

// Import routes
const statsRoutes = require("./routes/stats.routes");
const playerRoutes = require("./routes/player.routes");
const worldRoutes = require("./routes/world.routes");
const adminRoutes = require("./routes/admin.routes");
const cacheRoutes = require("./routes/cache.routes");
const mojangRoutes = require("./routes/mojang.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
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

// API routes (require API key)
app.use("/api", requireApiKey, statsRoutes);
app.use("/api/players", requireApiKey, playerRoutes);
app.use("/api/player", requireApiKey, playerRoutes); // Backward compatibility
app.use("/api", requireApiKey, worldRoutes);
app.use("/api/cache", requireApiKey, cacheRoutes);
app.use("/api/mojang", requireApiKey, mojangRoutes);

// Admin routes (require admin key)
app.use("/admin", requireAdminKey, adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
