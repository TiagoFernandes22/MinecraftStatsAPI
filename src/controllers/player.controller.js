const nbtService = require("../services/nbt.service");
const playerService = require("../services/player.service");
const statsService = require("../services/stats.service");
const mojangService = require("../services/mojang.service");
const userService = require("../services/user.service");

class PlayerController {
  /**
   * GET /api/players/all
   * Get all players with basic info
   */
  async getAllPlayers(req, res, next) {
    try {
      const username = req.user.userId || req.user.username;
      const { statsDir } = userService.getUserWorldPaths(username);
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
   * POST /api/players/filter
   * Get filtered players with stats and inventory
   */
  async getFilteredPlayers(req, res, next) {
    try {
      const { uuids } = req.body;

      if (!Array.isArray(uuids)) {
        return res.status(400).json({
          success: false,
          error: 'Body must contain "uuids" array',
        });
      }

      const username = req.user.userId || req.user.username;
      const { statsDir, playerdataDir, worldDir } =
        userService.getUserWorldPaths(username);
      const players = await playerService.getAllPlayersWithStatsAndInventory(
        statsDir,
        playerdataDir,
        uuids,
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
   * GET /api/players/:uuid/inventory
   * Get player inventory
   */
  async getPlayerInventory(req, res, next) {
    try {
      const { uuid } = req.params;
      const username = req.user.userId || req.user.username;
      const { playerdataDir } = userService.getUserWorldPaths(username);

      const player = await playerService.getPlayerWithInventory(
        uuid,
        playerdataDir
      );

      res.json({
        success: true,
        player,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/players/:uuid
   * Get player with stats and inventory
   */
  async getPlayer(req, res, next) {
    try {
      const { uuid } = req.params;
      const username = req.user.userId || req.user.username;
      const { statsDir, playerdataDir } =
        userService.getUserWorldPaths(username);

      const player = await playerService.getPlayerWithStatsAndInventory(
        uuid,
        statsDir,
        playerdataDir
      );

      res.json({
        success: true,
        player,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mojang/:uuid
   * Get Mojang profile
   */
  async getMojangProfile(req, res, next) {
    try {
      const { uuid } = req.params;
      const profile = await mojangService.fetchPlayerProfile(uuid);

      res.json({
        success: true,
        profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/players/hidden
   * Get user's player filter settings (list of hidden players)
   */
  async getPlayerFilter(req, res, next) {
    try {
      const username = req.user.userId || req.user.username;
      const { worldDir } = userService.getUserWorldPaths(username);
      const hiddenPlayers = await userService.loadPlayerFilter(worldDir);

      res.json({
        success: true,
        hiddenPlayers,
        count: hiddenPlayers.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/players/hidden
   * Update user's player filter settings
   * Body: { hiddenPlayers: ["uuid1", "uuid2", ...] }
   */
  async updatePlayerFilter(req, res, next) {
    try {
      const { hiddenPlayers } = req.body;

      if (hiddenPlayers === undefined) {
        return res.status(400).json({
          success: false,
          error: "hiddenPlayers field is required",
          example: { hiddenPlayers: ["uuid1", "uuid2"] },
        });
      }

      if (!Array.isArray(hiddenPlayers)) {
        return res.status(400).json({
          success: false,
          error: "hiddenPlayers must be an array",
          example: { hiddenPlayers: ["uuid1", "uuid2"] },
        });
      }

      const username = req.user.userId || req.user.username;
      const result = await userService.savePlayerFilter(
        username,
        hiddenPlayers
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PlayerController();
