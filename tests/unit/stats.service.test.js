const statsService = require("../../src/services/stats.service");

describe("Stats Service", () => {
  describe("extractKeyStats", () => {
    it("should extract basic stats correctly", () => {
      const rawStats = {
        custom: {
          play_time: 86400000, // 20 ticks/sec * 60 sec * 60 min = 72000 minutes
          deaths: 5,
          player_kills: 2,
          jump: 1000,
          walk_one_cm: 500000,
          sprint_one_cm: 200000,
          fly_one_cm: 10000,
          damage_taken: 5000, // Divided by 10 = 500
          damage_dealt: 10000, // Divided by 10 = 1000
          enchant_item: 10,
          animals_bred: 5,
          fish_caught: 20,
        },
        killed: {
          zombie: 50,
          skeleton: 30,
          creeper: 20,
        },
      };

      const result = statsService.extractKeyStats(rawStats);

      expect(result).toEqual({
        playtime: 72000,
        deaths: 5,
        mobKills: 100, // Total from killed
        playerKills: 2,
        blocksMined: 0,
        jumps: 1000,
        distanceWalked: 5000,
        distanceSprinted: 2000,
        distanceFlown: 100,
        damageTaken: 500,
        damageDealt: 1000,
        itemsEnchanted: 10,
        animalsBreed: 5,
        fishCaught: 20,
      });
    });

    it("should handle missing stats with defaults", () => {
      const result = statsService.extractKeyStats({});

      expect(result.playtime).toBe(0);
      expect(result.deaths).toBe(0);
      expect(result.mobKills).toBe(0);
      expect(result.playerKills).toBe(0);
      expect(result.blocksMined).toBe(0);
    });

    it("should calculate total blocks mined", () => {
      const rawStats = {
        mined: {
          stone: 100,
          dirt: 50,
          diamond_ore: 10,
        },
      };

      const result = statsService.extractKeyStats(rawStats);

      expect(result.blocksMined).toBe(160);
    });

    it("should remove minecraft: prefix from stats", () => {
      const rawStats = {
        "minecraft:custom": {
          "minecraft:play_time": 1440000, // 1200 minutes
          "minecraft:deaths": 3,
        },
      };

      const result = statsService.extractKeyStats(rawStats);

      expect(result.playtime).toBe(1200);
      expect(result.deaths).toBe(3);
    });

    it("should handle partial stats data", () => {
      const rawStats = {
        custom: {
          deaths: 10,
        },
        killed: {
          zombie: 30,
          skeleton: 20,
        },
      };

      const result = statsService.extractKeyStats(rawStats);

      expect(result.deaths).toBe(10);
      expect(result.mobKills).toBe(50);
      expect(result.playtime).toBe(0);
      expect(result.jumps).toBe(0);
    });
  });
});
