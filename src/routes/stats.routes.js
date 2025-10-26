const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats.controller");
const playerController = require("../controllers/player.controller");
const { validate, schemas } = require("../middleware/validation.middleware");

router.get("/local/stats", statsController.getLocalStats);

router.get(
  "/local/stats-with-inventory",
  statsController.getLocalStatsWithInventory
);

router.get(
  "/local/stats/:uuid",
  validate(schemas.uuidParam, "params"),
  statsController.getPlayerStats
);

// Backward compatibility - old endpoint paths
router.get(
  "/local/inventory/:uuid",
  validate(schemas.uuidParam, "params"),
  playerController.getPlayerInventory
);

router.get(
  "/local/player/:uuid",
  validate(schemas.uuidParam, "params"),
  playerController.getPlayer
);

module.exports = router;
