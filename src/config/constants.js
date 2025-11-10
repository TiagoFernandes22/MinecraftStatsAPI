// Application constants
module.exports = {
  CACHE_DURATION: 3600000, // 1 hour in milliseconds

  STORAGE_QUOTAS: {
    MAX_TOTAL_SIZE: 20 * 1024 * 1024, // 20 MB
    MAX_FILE_COUNT: 10000,
  },

  FILE_LIMITS: {
    MAX_JSON_SIZE: 5 * 1024 * 1024, // 5 MB
    MAX_WORLD_SIZE: 100 * 1024 * 1024, // 100 MB
  },

  RATE_LIMIT: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 120,
  },

  PATHS: {
    UPLOADS_DIR: "uploads/worlds",
    DATA_DIR: "data",
    USERS_FILE: "data/users.json",
  },
};
