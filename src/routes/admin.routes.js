const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

router.post("/users", adminController.createUser);
router.get("/users", adminController.listUsers);
router.put("/users/:username", adminController.updateUser);
router.delete("/users/:username", adminController.deleteUser);
router.get("/storage", adminController.getAllStorageStats);

module.exports = router;
