const request = require("supertest");
const app = require("../../src/app");
const fs = require("fs").promises;
const path = require("path");

describe("World Endpoints", () => {
  let apiKey;
  let userId;

  beforeAll(async () => {
    // Create a test user
    const adminResponse = await request(app)
      .post("/admin/users")
      .set("x-admin-key", process.env.ADMIN_KEY)
      .send({ userId: "test-world-user", displayName: "Test World User" });

    apiKey = adminResponse.body.user.apiKey;
    userId = adminResponse.body.user.userId;
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

  describe("GET /api/world/info", () => {
    it("should return 404 when no world exists", async () => {
      const response = await request(app)
        .get("/api/world/info")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toContain("not found");
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/world/info");

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/world", () => {
    it("should return 404 when trying to delete non-existent world", async () => {
      const response = await request(app)
        .delete("/api/world")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toContain("not found");
    });

    it("should require authentication", async () => {
      const response = await request(app).delete("/api/world");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/storage", () => {
    it("should return storage statistics", async () => {
      const response = await request(app)
        .get("/api/storage")
        .set("x-api-key", apiKey);

      // Should return either storage stats or 404 if no world
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("storage");
      }
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/storage");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/upload/world", () => {
    it("should reject upload without file", async () => {
      const response = await request(app)
        .post("/api/upload/world")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("No file");
    });

    it("should reject non-zip files", async () => {
      const response = await request(app)
        .post("/api/upload/world")
        .set("x-api-key", apiKey)
        .attach("world", Buffer.from("not a zip"), "test.txt");

      expect(response.status).toBe(400);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/upload/world")
        .attach("world", Buffer.from("test"), "test.zip");

      expect(response.status).toBe(401);
    });

    // Note: Testing actual zip upload would require creating a valid zip file
    // This is covered in end-to-end tests with fixture files
  });

  describe("PUT /api/world", () => {
    it("should return 404 when no existing world to replace", async () => {
      const response = await request(app)
        .put("/api/world")
        .set("x-api-key", apiKey)
        .attach("world", Buffer.from("test"), "test.zip");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toContain("No existing world");
    });

    it("should reject replacement without file", async () => {
      const response = await request(app)
        .put("/api/world")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("No file");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .put("/api/world")
        .attach("world", Buffer.from("test"), "test.zip");

      expect(response.status).toBe(401);
    });

    // Note: Testing successful replacement would require:
    // 1. Creating and uploading a valid world first
    // 2. Then replacing it with another valid world
    // This is covered in end-to-end tests with fixture files
  });
});
