const express = require("express");
const router = express.Router();
const playerController = require("../controllers/player.controller");
const { validate, schemas } = require("../middleware/validation.middleware");

router.get(
  "/:uuid",
  validate(schemas.uuidParam, "params"),
  playerController.getMojangProfile
);

module.exports = router;
