const nbtService = require("./nbt.service");
const mojangService = require("./mojang.service");
const statsService = require("./stats.service");
const userService = require("./user.service");

class PlayerService {
  /**
   * Get player profile with inventory
   */
  async getPlayerWithInventory(uuid, playerdataDir) {
    const [profile, inventoryData] = await Promise.all([
      mojangService.fetchPlayerProfile(uuid),
      nbtService.readPlayerInventory(uuid, playerdataDir),
    ]);

    return {
      uuid,
      name: profile.name,
      skin: profile.skin,
      cape: profile.cape,
      totalItems: inventoryData.totalItems,
      inventory: inventoryData.inventory,
    };
  }

  /**
   * Get player with stats and inventory
   */
  async getPlayerWithStatsAndInventory(uuid, statsDir, playerdataDir) {
    try {
      const [statsData, profile, inventoryData] = await Promise.all([
        statsService.getPlayerStats(statsDir, uuid).catch(() => null),
        mojangService.fetchPlayerProfile(uuid),
        nbtService.readPlayerInventory(uuid, playerdataDir),
      ]);

      return {
        uuid,
        name: profile?.name || uuid.substring(0, 8),
        skin: profile?.skin || null,
        cape: profile?.cape || null,
        stats: statsData?.stats || {},
        rawStats: statsData?.rawStats || {},
        totalItems: inventoryData.totalItems,
        inventory: inventoryData.inventory,
      };
    } catch (error) {
      console.error(`Error getting player ${uuid}:`, error);
      throw error;
    }
  }

  /**
   * Get all players with stats and inventory (parallel processing)
   * Respects player-filter.json if it exists
   */
  async getAllPlayersWithStatsAndInventory(
    statsDir,
    playerdataDir,
    filterUuids = null,
    worldDir = null
  ) {
    const allPlayers = await statsService.getAllPlayerStats(statsDir);
    let allUuids = allPlayers.map((p) => p.uuid);

    // Apply hidden players filter if worldDir is provided
    if (worldDir) {
      const hiddenPlayers = await userService.loadPlayerFilter(worldDir);
      if (hiddenPlayers.length > 0) {
        const hiddenSet = new Set(hiddenPlayers.map((id) => id.toLowerCase()));
        allUuids = allUuids.filter(
          (uuid) => !hiddenSet.has(uuid.toLowerCase())
        );
      }
    }

    let uuidsToProcess = allUuids;
    if (filterUuids && Array.isArray(filterUuids) && filterUuids.length > 0) {
      const filterSet = new Set(filterUuids.map((id) => id.toLowerCase()));
      uuidsToProcess = allUuids.filter((uuid) =>
        filterSet.has(uuid.toLowerCase())
      );
    }

    const players = await Promise.all(
      uuidsToProcess.map((uuid) =>
        this.getPlayerWithStatsAndInventory(uuid, statsDir, playerdataDir)
      )
    );

    return players;
  }
}

module.exports = new PlayerService();
