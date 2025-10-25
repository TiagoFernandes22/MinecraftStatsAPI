const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

router.post("/users", adminController.createUser);
router.get("/users", adminController.listUsers);
router.get("/users/:userId", adminController.getUser);
router.put("/users/:userId", adminController.updateUser);
router.delete("/users/:userId", adminController.deleteUser);
router.get("/storage", adminController.getAllStorageStats);

module.exports = router;
