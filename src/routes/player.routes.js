const express = require("express");
const router = express.Router();
const playerController = require("../controllers/player.controller");
const { validate, schemas } = require("../middleware/validation.middleware");

router.get("/all", playerController.getAllPlayers);

router.get("/hidden", playerController.getPlayerFilter);

router.post(
  "/hidden",
  validate(schemas.hiddenPlayers),
  playerController.addToPlayerFilter
);

router.put(
  "/hidden",
  validate(schemas.hiddenPlayers),
  playerController.replacePlayerFilter
);

router.delete(
  "/hidden",
  validate(schemas.hiddenPlayers),
  playerController.removeFromPlayerFilter
);

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
