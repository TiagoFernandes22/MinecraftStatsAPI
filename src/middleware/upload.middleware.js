const multer = require("multer");
const { FILE_LIMITS } = require("../config/constants");

/**
 * Multer configuration for world uploads
 */
const worldUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_LIMITS.MAX_WORLD_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed" ||
      file.originalname.endsWith(".zip")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are allowed"), false);
    }
  },
});

/**
 * Multer configuration for JSON uploads
 */
const jsonUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_LIMITS.MAX_JSON_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/json" ||
      file.originalname.endsWith(".json")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .json files are allowed"), false);
    }
  },
});

module.exports = {
  worldUpload,
  jsonUpload,
};
