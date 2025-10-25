const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats.controller");
const playerController = require("../controllers/player.controller");

router.get("/local/stats", statsController.getLocalStats);
router.get(
  "/local/stats-with-inventory",
  statsController.getLocalStatsWithInventory
);
router.get("/local/stats/:uuid", statsController.getPlayerStats);

// Backward compatibility - old endpoint paths
router.get("/local/inventory/:uuid", playerController.getPlayerInventory);
router.get("/local/player/:uuid", playerController.getPlayer);

module.exports = router;
