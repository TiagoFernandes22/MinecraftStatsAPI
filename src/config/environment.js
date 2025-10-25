require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  ADMIN_KEY: process.env.ADMIN_KEY,
  API_KEYS: process.env.API_KEYS ? process.env.API_KEYS.split(",") : [],
  STATS_DIR: process.env.STATS_DIR,
  PLAYERDATA_DIR: process.env.PLAYERDATA_DIR,
  NODE_ENV: process.env.NODE_ENV || "development",
};
