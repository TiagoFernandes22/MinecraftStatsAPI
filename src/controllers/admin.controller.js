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
      const { username } = req.body;

      if (!username || typeof username !== "string") {
        return res.status(400).json({
          success: false,
          error: "Username required",
        });
      }

      const result = await userService.createUser(username);

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
        username: user.userId || user.username,
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
   * PUT /admin/users/:username
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const { username } = req.params;
      const { displayName } = req.body;

      if (!displayName || typeof displayName !== "string") {
        return res.status(400).json({
          success: false,
          error: "displayName is required",
        });
      }

      const result = await userService.updateUser(username, { displayName });

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/users/:username
   * Delete user
   */
  async deleteUser(req, res, next) {
    try {
      const { username } = req.params;

      const result = await userService.deleteUser(username);

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
