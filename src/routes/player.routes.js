const express = require("express");
const router = express.Router();
const playerController = require("../controllers/player.controller");

router.get("/all", playerController.getAllPlayers);
router.get("/hidden", playerController.getPlayerFilter);
router.put("/hidden", playerController.updatePlayerFilter);
router.post("/hidden", playerController.updatePlayerFilter); // Support POST for backward compatibility
router.post("/filter", playerController.getFilteredPlayers);
router.get("/:uuid/inventory", playerController.getPlayerInventory);
router.get("/:uuid", playerController.getPlayer);

module.exports = router;
