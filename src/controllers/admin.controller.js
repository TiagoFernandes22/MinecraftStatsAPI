const userService = require("../services/user.service");
const storageService = require("../services/storage.service");
const { PATHS } = require("../config/constants");

class AdminController {
  /**
   * POST /admin/users
   * Create new user
   */
  async createUser(req, res, next) {
    try {
      const { userId, displayName } = req.body;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({
          success: false,
          error: "userId is required and must be a string",
        });
      }

      const result = await userService.createUser(userId, displayName);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users
   * List all users
   */
  async listUsers(req, res, next) {
    try {
      const users = await userService.loadUsers();

      const usersWithoutKeys = users.map((user) => ({
        userId: user.userId || user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
      }));

      res.json({
        success: true,
        count: users.length,
        users: usersWithoutKeys,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users/:userId
   * Get specific user details
   */
  async getUser(req, res, next) {
    try {
      const { userId } = req.params;
      const users = await userService.loadUsers();

      const user = users.find(
        (u) => u.userId === userId || u.username === userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        user: {
          userId: user.userId || user.username,
          displayName: user.displayName,
          apiKey: user.apiKey,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/storage
   * Get all users storage statistics
   */
  async getAllStorageStats(req, res, next) {
    try {
      const stats = await storageService.getAllUsersStorageStats(
        PATHS.UPLOADS_DIR
      );

      res.json({
        success: true,
        count: stats.length,
        users: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/users/:userId
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { displayName } = req.body;

      if (!displayName || typeof displayName !== "string") {
        return res.status(400).json({
          success: false,
          error: "displayName is required",
        });
      }

      const result = await userService.updateUser(userId, { displayName });

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/users/:userId
   * Delete user
   */
  async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      const result = await userService.deleteUser(userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/users/:userId/regenerate-key
   * Regenerate API key for user
   */
  async regenerateApiKey(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await userService.regenerateApiKey(userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
