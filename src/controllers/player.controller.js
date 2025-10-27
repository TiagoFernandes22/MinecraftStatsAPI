const nbtService = require("../services/nbt.service");
const playerService = require("../services/player.service");
const statsService = require("../services/stats.service");
const mojangService = require("../services/mojang.service");
const userService = require("../services/user.service");

class PlayerController {
  /**
   * GET /api/players/all
   * Get all players with basic info
   * Query params: ?statsOnly=true to exclude inventory data
   */
  async getAllPlayers(req, res, next) {
    try {
      const username = req.user.userId || req.user.username;
      const { statsDir, playerdataDir, worldDir } =
        userService.getUserWorldPaths(username);
      const statsOnly = req.query.statsOnly === "true";

      let players;
      if (statsOnly) {
        // Only return stats, no inventory
        players = await statsService.getAllPlayerStats(statsDir);
      } else {
        // Return stats with inventory
        players = await playerService.getAllPlayersWithStatsAndInventory(
          statsDir,
          playerdataDir,
          null,
          worldDir
        );
      }

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
   * Query params: ?statsOnly=true to exclude inventory data
   */
  async getPlayer(req, res, next) {
    try {
      const { uuid } = req.params;
      const username = req.user.userId || req.user.username;
      const { statsDir, playerdataDir } =
        userService.getUserWorldPaths(username);
      const statsOnly = req.query.statsOnly === "true";

      let player;
      if (statsOnly) {
        // Only return stats
        player = await statsService.getPlayerStats(statsDir, uuid);
        if (!player) {
          return res.status(404).json({
            success: false,
            error: "Player not found",
          });
        }
      } else {
        // Return stats with inventory
        player = await playerService.getPlayerWithStatsAndInventory(
          uuid,
          statsDir,
          playerdataDir
        );
      }

      res.json({
        success: true,
        player,
      });
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
   * POST /api/players/hidden
   * Add players to the hidden list (doesn't remove existing ones)
   * Body: { hiddenPlayers: ["uuid1", "uuid2", ...] }
   */
  async addToPlayerFilter(req, res, next) {
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
      const { worldDir } = userService.getUserWorldPaths(username);

      // Load existing hidden players
      const existingHidden = await userService.loadPlayerFilter(worldDir);

      // Merge with new ones (remove duplicates)
      const mergedHidden = [...new Set([...existingHidden, ...hiddenPlayers])];

      // Calculate how many were actually added (new UUIDs only)
      const actuallyAdded = mergedHidden.length - existingHidden.length;

      const result = await userService.savePlayerFilter(username, mergedHidden);

      res.json({
        ...result,
        added: actuallyAdded,
        totalHidden: mergedHidden.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/players/hidden
   * Replace entire hidden players list
   * Body: { hiddenPlayers: ["uuid1", "uuid2", ...] }
   */
  async replacePlayerFilter(req, res, next) {
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

  /**
   * DELETE /api/players/hidden
   * Remove players from the hidden list
   * Body: { hiddenPlayers: ["uuid1", "uuid2", ...] }
   */
  async removeFromPlayerFilter(req, res, next) {
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
      const { worldDir } = userService.getUserWorldPaths(username);

      // Load existing hidden players
      const existingHidden = await userService.loadPlayerFilter(worldDir);

      // Remove specified UUIDs
      const updatedHidden = existingHidden.filter(
        (uuid) => !hiddenPlayers.includes(uuid)
      );

      const result = await userService.savePlayerFilter(
        username,
        updatedHidden
      );

      res.json({
        ...result,
        removed: existingHidden.length - updatedHidden.length,
        totalHidden: updatedHidden.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PlayerController();
