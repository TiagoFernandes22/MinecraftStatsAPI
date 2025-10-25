const request = require("supertest");
const app = require("../../src/app");
const cache = require("../../src/utils/cache");

describe("Cache Endpoints", () => {
  let apiKey;

  beforeAll(async () => {
    // Create a test user for authentication
    const adminResponse = await request(app)
      .post("/admin/users")
      .set("x-admin-key", process.env.ADMIN_KEY)
      .send({ userId: "test-cache-user", displayName: "Test Cache User" });

    apiKey = adminResponse.body.user.apiKey;
  });

  beforeEach(() => {
    // Add some test data to cache
    cache.set("test-key-1", { data: "value1" });
    cache.set("test-key-2", { data: "value2" });
  });

  describe("DELETE /api/cache", () => {
    it("should clear the cache", async () => {
      // Verify cache has data
      expect(cache.get("test-key-1")).toBeTruthy();

      const response = await request(app)
        .delete("/api/cache")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Cache cleared");

      // Verify cache is empty
      expect(cache.get("test-key-1")).toBeNull();
      expect(cache.get("test-key-2")).toBeNull();
    });

    it("should require authentication", async () => {
      const response = await request(app).delete("/api/cache");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/cache/stats", () => {
    it("should return cache statistics", async () => {
      const response = await request(app)
        .get("/api/cache/stats")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("cache");
      expect(response.body.cache).toHaveProperty("size");
      expect(response.body.cache).toHaveProperty("keys");
      expect(response.body.cache.size).toBeGreaterThanOrEqual(2);
    });

    it("should show zero size after clearing", async () => {
      // Clear cache
      await request(app).delete("/api/cache").set("x-api-key", apiKey);

      // Get stats
      const response = await request(app)
        .get("/api/cache/stats")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body.cache.size).toBe(0);
      expect(response.body.cache.keys).toEqual([]);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/cache/stats");

      expect(response.status).toBe(401);
    });
  });
});
