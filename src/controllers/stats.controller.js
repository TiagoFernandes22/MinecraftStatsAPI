const statsService = require("../services/stats.service");
const playerService = require("../services/player.service");
const userService = require("../services/user.service");

class StatsController {
  /**
   * GET /api/local/stats
   * Get all player stats without inventory
   */
  async getLocalStats(req, res, next) {
    try {
      const username = req.user.userId || req.user.username;
      const { statsDir, playerdataDir } =
        userService.getUserWorldPaths(username);
      const players = await statsService.getAllPlayerStats(statsDir);

      res.json({
        success: true,
        count: players.length,
        players,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/local/stats-with-inventory
   * Get all player stats with inventory
   */
  async getLocalStatsWithInventory(req, res, next) {
    try {
      const username = req.user.userId || req.user.username;
      const { statsDir, playerdataDir, worldDir } =
        userService.getUserWorldPaths(username);
      const players = await playerService.getAllPlayersWithStatsAndInventory(
        statsDir,
        playerdataDir,
        null,
        worldDir
      );

      res.json({
        success: true,
        count: players.length,
        players,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/local/stats/:uuid
   * Get single player stats
   */
  async getPlayerStats(req, res, next) {
    try {
      const { uuid } = req.params;
      const username = req.user.userId || req.user.username;
      const { statsDir } = userService.getUserWorldPaths(username);

      const player = await statsService.getPlayerStats(statsDir, uuid);

      if (!player) {
        return res.status(404).json({
          success: false,
          error: "Player not found",
        });
      }

      res.json(player);
    } catch (error) {
      // Handle "not found" errors
      if (error.message && error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }
}

module.exports = new StatsController();
