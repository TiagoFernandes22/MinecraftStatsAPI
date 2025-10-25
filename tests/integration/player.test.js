const request = require("supertest");
const app = require("../../src/app");

describe("Player Endpoints", () => {
  let apiKey;

  beforeAll(async () => {
    // Create a test user
    const adminResponse = await request(app)
      .post("/admin/users")
      .set("x-admin-key", process.env.ADMIN_KEY)
      .send({ userId: "test-player-user", displayName: "Test Player User" });

    apiKey = adminResponse.body.user.apiKey;
  });

  describe("GET /api/players/all", () => {
    it("should return all players", async () => {
      const response = await request(app)
        .get("/api/players/all")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("count");
      expect(response.body).toHaveProperty("players");
      expect(Array.isArray(response.body.players)).toBe(true);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/players/all");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/players/filter", () => {
    it("should filter players by UUID list", async () => {
      const uuids = [
        "550e8400-e29b-41d4-a716-446655440000",
        "660e8400-e29b-41d4-a716-446655440001",
      ];

      const response = await request(app)
        .post("/api/players/filter")
        .set("x-api-key", apiKey)
        .send({ uuids });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("players");
      expect(Array.isArray(response.body.players)).toBe(true);
    });

    it("should return 400 if uuids is not an array", async () => {
      const response = await request(app)
        .post("/api/players/filter")
        .set("x-api-key", apiKey)
        .send({ uuids: "not-an-array" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("array");
    });

    it("should return 400 if uuids is missing", async () => {
      const response = await request(app)
        .post("/api/players/filter")
        .set("x-api-key", apiKey)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/players/filter")
        .send({ uuids: [] });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/players/:uuid/inventory", () => {
    it("should return player inventory", async () => {
      const testUuid = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app)
        .get(`/api/players/${testUuid}/inventory`)
        .set("x-api-key", apiKey);

      // Will return 200 with empty inventory or 404 if no player data
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("player");
      }
    });

    it("should require authentication", async () => {
      const testUuid = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app).get(
        `/api/players/${testUuid}/inventory`
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/players/:uuid", () => {
    it("should return player with stats and inventory", async () => {
      const testUuid = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app)
        .get(`/api/players/${testUuid}`)
        .set("x-api-key", apiKey);

      // Will return 200 or 404 depending on data availability
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("player");
      }
    });

    it("should require authentication", async () => {
      const testUuid = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app).get(`/api/players/${testUuid}`);

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/mojang/:uuid", () => {
    it("should fetch Mojang profile", async () => {
      // Use a known Minecraft UUID (Notch's UUID)
      const notchUuid = "069a79f4-44e9-4726-a5be-fca90e38aaf5";

      const response = await request(app)
        .get(`/api/mojang/${notchUuid}`)
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("profile");
    });

    it("should require authentication", async () => {
      const testUuid = "069a79f4-44e9-4726-a5be-fca90e38aaf5";

      const response = await request(app).get(`/api/mojang/${testUuid}`);

      expect(response.status).toBe(401);
    });
  });
});
