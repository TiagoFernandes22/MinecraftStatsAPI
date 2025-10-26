const express = require("express");
const router = express.Router();
const playerController = require("../controllers/player.controller");
const { validate, schemas } = require("../middleware/validation.middleware");

router.get("/all", playerController.getAllPlayers);

router.get("/hidden", playerController.getPlayerFilter);

router.put(
  "/hidden",
  validate(schemas.hiddenPlayers),
  playerController.updatePlayerFilter
);

router.post(
  "/hidden",
  validate(schemas.hiddenPlayers),
  playerController.updatePlayerFilter
); // Support POST for backward compatibility

router.post(
  "/filter",
  validate(schemas.filterPlayers),
  playerController.getFilteredPlayers
);

router.get(
  "/:uuid/inventory",
  validate(schemas.uuidParam, "params"),
  playerController.getPlayerInventory
);

router.get(
  "/:uuid",
  validate(schemas.uuidParam, "params"),
  playerController.getPlayer
);

module.exports = router;
