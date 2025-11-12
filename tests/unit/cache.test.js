const cache = require("../../src/utils/cache");

describe("Cache Utility", () => {
  beforeEach(() => {
    cache.clear();
  });

  describe("set and get", () => {
    it("should store and retrieve values", () => {
      cache.set("test-key", { data: "test-value" });
      const result = cache.get("test-key");

      expect(result).toEqual({ data: "test-value" });
    });

    it("should return null for non-existent keys", () => {
      const result = cache.get("non-existent-key");
      expect(result).toBeNull();
    });

    it("should return null for expired entries", () => {
      // Set with 1ms TTL
      cache.set("test-key", { data: "test" }, 1);

      // Wait for expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          const result = cache.get("test-key");
          expect(result).toBeNull();
          resolve();
        }, 10);
      });
    });

    it("should not expire before TTL", () => {
      // Set with 1000ms TTL
      cache.set("test-key", { data: "test" }, 1000);
      const result = cache.get("test-key");

      expect(result).toEqual({ data: "test" });
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      cache.clear();

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
      expect(cache.get("key3")).toBeNull();
    });
  });

  describe("getStats", () => {
    it("should return cache statistics", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toBe(2);
      expect(stats.keys).toContain("key1");
      expect(stats.keys).toContain("key2");
    });

    it("should return empty stats for empty cache", () => {
      const stats = cache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.entries).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });
});
