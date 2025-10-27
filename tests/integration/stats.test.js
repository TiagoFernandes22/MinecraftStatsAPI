const request = require("supertest");
const app = require("../../src/app");
const fs = require("fs").promises;
const path = require("path");

describe("Player Stats Endpoints", () => {
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

  describe("GET /api/players/all?statsOnly=true", () => {
    it("should return player stats without inventory", async () => {
      const response = await request(app)
        .get("/api/players/all?statsOnly=true")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("count");
      expect(response.body).toHaveProperty("players");
      expect(Array.isArray(response.body.players)).toBe(true);
    });

    it("should require authentication", async () => {
      const response = await request(app).get(
        "/api/players/all?statsOnly=true"
      );

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
        .get("/api/players/all?statsOnly=true")
        .set("x-api-key", newUserRes.body.user.apiKey);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.players).toEqual([]);
    });
  });

  describe("GET /api/players/all", () => {
    it("should return stats with inventory data", async () => {
      const response = await request(app)
        .get("/api/players/all")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("count");
      expect(response.body).toHaveProperty("players");
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/players/all");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/players/:uuid?statsOnly=true", () => {
    it("should return stats only for specific player", async () => {
      const testUuid = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app)
        .get(`/api/players/${testUuid}?statsOnly=true`)
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.player).toHaveProperty("uuid");
      expect(response.body.player).toHaveProperty("name");
      expect(response.body.player).toHaveProperty("stats");
    });

    it("should return 404 for non-existent player", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .get(`/api/players/${fakeUuid}?statsOnly=true`)
        .set("x-api-key", apiKey);

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const testUuid = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app).get(
        `/api/players/${testUuid}?statsOnly=true`
      );

      expect(response.status).toBe(401);
    });
  });
});
