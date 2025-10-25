const express = require("express");
const router = express.Router();
const cacheController = require("../controllers/cache.controller");

router.delete("/", cacheController.clearCache);
router.get("/stats", cacheController.getCacheStats);

module.exports = router;
