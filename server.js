require("dotenv").config();
const app = require("./src/app");
const { PORT } = require("./src/config/environment");

const server = app.listen(PORT, () => {
  console.log(`Minecraft Stats API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check:  http://localhost:${PORT}/health`);
  console.log(`API docs:      http://localhost:${PORT}/api-docs`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
