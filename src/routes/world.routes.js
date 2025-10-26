const express = require("express");
const router = express.Router();
const worldController = require("../controllers/world.controller");
const { worldUpload } = require("../middleware/upload.middleware");

router.post(
  "/upload/world",
  worldUpload.single("world"),
  worldController.uploadWorld
);

router.put("/world", worldUpload.single("world"), worldController.replaceWorld);

router.delete("/world", worldController.deleteWorld);

router.get("/world/info", worldController.getWorldInfo);

router.get("/storage", worldController.getStorageStats);

module.exports = router;
