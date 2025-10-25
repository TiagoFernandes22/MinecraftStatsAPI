const fs = require("fs").promises;
const path = require("path");
const { listJsonFiles } = require("../utils/helpers");
const mojangService = require("./mojang.service");

class StatsService {
  /**
   * Extract key statistics from player data
   */
  extractKeyStats(stats) {
    // Remove "minecraft:" prefix from all stat keys
    const cleanStats = {};
    for (const [category, values] of Object.entries(stats)) {
      const cleanCategory = category.replace("minecraft:", "");
      if (typeof values === "object" && values !== null) {
        cleanStats[cleanCategory] = {};
        for (const [key, val] of Object.entries(values)) {
          cleanStats[cleanCategory][key.replace("minecraft:", "")] = val;
        }
      } else {
        cleanStats[cleanCategory] = values;
      }
    }

    const customStats = cleanStats.custom || {};
    const mined = cleanStats.mined || {};
    const killed = cleanStats.killed || {};

    const totalBlocksMined = Object.values(mined).reduce(
      (sum, val) => sum + val,
      0
    );
    const totalMobsKilled = Object.values(killed).reduce(
      (sum, val) => sum + val,
      0
    );

    return {
      playtime: Math.floor((customStats.play_time || 0) / 20 / 60),
      deaths: customStats.deaths || 0,
      mobKills: totalMobsKilled,
      playerKills: customStats.player_kills || 0,
      blocksMined: totalBlocksMined,
      jumps: customStats.jump || 0,
      distanceWalked: Math.floor((customStats.walk_one_cm || 0) / 100),
      distanceSprinted: Math.floor((customStats.sprint_one_cm || 0) / 100),
      distanceFlown: Math.floor((customStats.fly_one_cm || 0) / 100),
      damageTaken: Math.floor((customStats.damage_taken || 0) / 10),
      damageDealt: Math.floor((customStats.damage_dealt || 0) / 10),
      itemsEnchanted: customStats.enchant_item || 0,
      animalsBreed: customStats.animals_bred || 0,
      fishCaught: customStats.fish_caught || 0,
    };
  }

  /**
   * Read player stats from a file
   */
  async readPlayerStatsFromFile(statsDir, filename) {
    const filePath = path.join(statsDir, filename);
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    const uuid = path.basename(filename, ".json");
    const profile = await mojangService.fetchPlayerProfile(uuid);

    return {
      uuid,
      name: profile?.name || uuid.substring(0, 8), // Fallback to UUID if no name
      skin: profile?.skin || null,
      cape: profile?.cape || null,
      stats: this.extractKeyStats(data.stats || {}),
      dataVersion: data.DataVersion || 0,
      rawStats: data.stats || {},
    };
  }

  /**
   * Get all player stats for a user
   */
  async getAllPlayerStats(statsDir) {
    const files = await listJsonFiles(statsDir);

    const results = await Promise.all(
      files.map(async (filename) => {
        try {
          return await this.readPlayerStatsFromFile(statsDir, filename);
        } catch (error) {
          console.error(`Error processing ${filename}:`, error);
          return null;
        }
      })
    );

    return results.filter((r) => r !== null);
  }

  /**
   * Get single player stats
   */
  async getPlayerStats(statsDir, uuid) {
    const candidates = [`${uuid}.json`, `${uuid.replace(/-/g, "")}.json`];
    const files = await listJsonFiles(statsDir);
    const match = candidates.find((c) => files.includes(c));

    if (!match) {
      throw new Error("Player stats file not found");
    }

    return await this.readPlayerStatsFromFile(statsDir, match);
  }
}

module.exports = new StatsService();
