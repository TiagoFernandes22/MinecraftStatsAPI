const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { validate, schemas } = require("../middleware/validation.middleware");

router.post("/users", validate(schemas.createUser), adminController.createUser);

router.get("/users", adminController.listUsers);

router.get(
  "/users/:userId",
  validate(schemas.userIdParam, "params"),
  adminController.getUser
);

router.put(
  "/users/:userId",
  validate(schemas.userIdParam, "params"),
  validate(schemas.updateUser),
  adminController.updateUser
);

router.delete(
  "/users/:userId",
  validate(schemas.userIdParam, "params"),
  adminController.deleteUser
);

router.post(
  "/users/:userId/regenerate-key",
  validate(schemas.userIdParam, "params"),
  adminController.regenerateApiKey
);

router.get("/storage", adminController.getAllStorageStats);

module.exports = router;
