const worldService = require("../services/world.service");
const storageService = require("../services/storage.service");
const userService = require("../services/user.service");

class WorldController {
  /**
   * POST /api/upload/world
   * Upload world data
   */
  async uploadWorld(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      const username = req.user.userId || req.user.username;

      // Check if user already has a world
      const existingWorld = await worldService.getWorldInfo(username);
      if (existingWorld) {
        return res.status(409).json({
          success: false,
          error:
            "World already exists. Please delete your existing world before uploading a new one.",
          existingWorld: {
            statsCount: existingWorld.statsCount,
            playerdataCount: existingWorld.playerdataCount,
            sizeBytes: existingWorld.sizeBytes,
          },
        });
      }

      const result = await worldService.uploadWorld(username, req.file.buffer);

      // Check storage quota after upload
      const quota = await storageService.checkStorageQuota(result.path);
      if (quota.exceeded) {
        // Delete the uploaded world
        await worldService.deleteWorld(username);

        return res.status(413).json({
          success: false,
          error: "Storage quota exceeded",
          quota,
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/world
   * Delete world data
   */
  async deleteWorld(req, res, next) {
    try {
      const username = req.user.userId || req.user.username;
      const result = await worldService.deleteWorld(username);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/world
   * Replace existing world data
   */
  async replaceWorld(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      const username = req.user.userId || req.user.username;

      // Check if world exists
      const existingWorld = await worldService.getWorldInfo(username);
      if (!existingWorld) {
        return res.status(404).json({
          success: false,
          error:
            "No existing world found. Use POST /api/upload/world to create a new world.",
        });
      }

      // Delete existing world and upload new one
      const result = await worldService.uploadWorld(username, req.file.buffer);

      // Check storage quota after upload
      const quota = await storageService.checkStorageQuota(result.path);
      if (quota.exceeded) {
        // Delete the uploaded world
        await worldService.deleteWorld(username);

        return res.status(413).json({
          success: false,
          error: "Storage quota exceeded",
          quota,
        });
      }

      res.json({
        ...result,
        message: "World replaced successfully",
        previousWorld: {
          statsCount: existingWorld.statsCount,
          playerdataCount: existingWorld.playerdataCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/world/info
   * Get world information
   */
  async getWorldInfo(req, res, next) {
    try {
      const username = req.user.userId || req.user.username;
      const info = await worldService.getWorldInfo(username);
      if (!info) {
        return res.status(404).json({
          success: false,
          error: "World not found",
        });
      }

      res.json({
        success: true,
        world: info,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/storage
   * Get storage statistics
   */
  async getStorageStats(req, res, next) {
    try {
      const username = req.user.userId || req.user.username;
      const { worldDir } = userService.getUserWorldPaths(username);
      const stats = await storageService.getUserStorageStats(worldDir);

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: "No storage data found",
        });
      }

      res.json({
        success: true,
        storage: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorldController();
