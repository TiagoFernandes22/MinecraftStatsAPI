const request = require("supertest");
const app = require("../../src/app");
const fs = require("fs").promises;
const path = require("path");

describe("Stats Endpoints", () => {
  let apiKey;
  let userId;

  beforeAll(async () => {
    // Create a test user
    const adminResponse = await request(app)
      .post("/admin/users")
      .set("x-admin-key", process.env.ADMIN_KEY)
      .send({ userId: "test-stats-user", displayName: "Test Stats User" });

    apiKey = adminResponse.body.user.apiKey;
    userId = adminResponse.body.user.userId;

    // Create test stats directory with sample data
    const statsDir = path.join(
      __dirname,
      "../../uploads/worlds",
      userId,
      "stats"
    );
    await fs.mkdir(statsDir, { recursive: true });

    // Create a sample stats file
    const testUuid = "550e8400-e29b-41d4-a716-446655440000";
    const statsData = {
      stats: {
        "minecraft:custom": {
          "minecraft:play_one_minute": 72000,
          "minecraft:deaths": 5,
          "minecraft:mob_kills": 150,
        },
      },
      DataVersion: 3465,
    };

    await fs.writeFile(
      path.join(statsDir, `${testUuid}.json`),
      JSON.stringify(statsData, null, 2)
    );
  });

  afterAll(async () => {
    // Clean up test data
    const worldDir = path.join(__dirname, "../../uploads/worlds", userId);
    try {
      await fs.rm(worldDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  });

  describe("GET /api/local/stats", () => {
    it("should return player stats", async () => {
      const response = await request(app)
        .get("/api/local/stats")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("count");
      expect(response.body).toHaveProperty("players");
      expect(Array.isArray(response.body.players)).toBe(true);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/local/stats");

      expect(response.status).toBe(401);
    });

    it("should return empty array if no stats exist", async () => {
      // Create a user with no stats
      const newUserRes = await request(app)
        .post("/admin/users")
        .set("x-admin-key", process.env.ADMIN_KEY)
        .send({
          userId: "test-empty-stats-user",
          displayName: "Test Empty Stats User",
        });

      const response = await request(app)
        .get("/api/local/stats")
        .set("x-api-key", newUserRes.body.user.apiKey);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.players).toEqual([]);
    });
  });

  describe("GET /api/local/stats-with-inventory", () => {
    it("should return stats with inventory data", async () => {
      const response = await request(app)
        .get("/api/local/stats-with-inventory")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("count");
      expect(response.body).toHaveProperty("players");
    });

    it("should require authentication", async () => {
      const response = await request(app).get(
        "/api/local/stats-with-inventory"
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/local/stats/:uuid", () => {
    it("should return stats for specific player", async () => {
      const testUuid = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app)
        .get(`/api/local/stats/${testUuid}`)
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("uuid");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("stats");
    });

    it("should return 404 for non-existent player", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .get(`/api/local/stats/${fakeUuid}`)
        .set("x-api-key", apiKey);

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const testUuid = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app).get(`/api/local/stats/${testUuid}`);

      expect(response.status).toBe(401);
    });
  });
});
