/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    message = "Invalid authentication";
  } else if (err.code === "ENOENT") {
    statusCode = 404;
    message = "File not found";
  } else if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File too large";
  } else if (err.name === "MulterError") {
    // Handle Multer-specific errors
    statusCode = 400;
    message = err.message;
  } else if (err.message && err.message.includes("Only .zip files")) {
    // Handle file filter errors from Multer
    statusCode = 400;
    message = err.message;
  } else if (err.message && err.message.includes("Only .json files")) {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
