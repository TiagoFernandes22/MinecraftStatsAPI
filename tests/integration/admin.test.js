const request = require("supertest");
const app = require("../../src/app");
const fs = require("fs").promises;
const path = require("path");

describe("Admin Endpoints", () => {
  const adminKey = process.env.ADMIN_KEY;

  beforeAll(async () => {
    // Ensure data directory exists
    const constants = require("../../src/config/constants");
    await fs.mkdir(path.dirname(constants.PATHS.USERS_FILE), {
      recursive: true,
    });
  });

  afterEach(async () => {
    // Clean up test users after each test
    try {
      const constants = require("../../src/config/constants");
      const data = await fs.readFile(constants.PATHS.USERS_FILE, "utf8");
      const users = JSON.parse(data);
      // Keep only non-test users (fixture users)
      users.users = users.users.filter(
        (u) =>
          !u.username.startsWith("test-admin-") &&
          !(u.userId && u.userId.startsWith("test-admin-"))
      );
      await fs.writeFile(
        constants.PATHS.USERS_FILE,
        JSON.stringify(users, null, 2)
      );
    } catch (error) {
      // File might not exist, ignore
    }
  });

  describe("POST /admin/users", () => {
    it("should create a new user with valid admin key", async () => {
      const response = await request(app)
        .post("/admin/users")
        .set("x-admin-key", adminKey)
        .send({
          userId: "test-admin-user-1",
          displayName: "Test Admin User 1",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("userId", "test-admin-user-1");
      expect(response.body.user).toHaveProperty("apiKey");
      expect(response.body.user.apiKey).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should reject creation without userId", async () => {
      const response = await request(app)
        .post("/admin/users")
        .set("x-admin-key", adminKey)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toContain("userId is required");
    });

    it("should reject creation with invalid username type", async () => {
      const response = await request(app)
        .post("/admin/users")
        .set("x-admin-key", adminKey)
        .send({ userId: 12345 });

      expect(response.status).toBe(400);
    });

    it("should reject duplicate userId", async () => {
      // Create first user
      await request(app)
        .post("/admin/users")
        .set("x-admin-key", adminKey)
        .send({
          userId: "test-admin-duplicate",
          displayName: "Test Duplicate",
        });

      // Try to create again
      const response = await request(app)
        .post("/admin/users")
        .set("x-admin-key", adminKey)
        .send({
          userId: "test-admin-duplicate",
          displayName: "Test Duplicate",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("already exists");
    });
  });

  describe("GET /admin/users", () => {
    beforeEach(async () => {
      // Create test users
      await request(app)
        .post("/admin/users")
        .set("x-admin-key", adminKey)
        .send({ userId: "test-admin-list-1", displayName: "Test List 1" });

      await request(app)
        .post("/admin/users")
        .set("x-admin-key", adminKey)
        .send({ userId: "test-admin-list-2", displayName: "Test List 2" });
    });

    it("should list all users", async () => {
      const response = await request(app)
        .get("/admin/users")
        .set("x-admin-key", adminKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("count");
      expect(response.body).toHaveProperty("users");
      expect(Array.isArray(response.body.users)).toBe(true);
      // Should have at least the 2 test users we just created
      // (plus any fixture users from test-users.json)
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });

    it("should not expose API keys in user list", async () => {
      const response = await request(app)
        .get("/admin/users")
        .set("x-admin-key", adminKey);

      expect(response.status).toBe(200);

      // Check that API keys are not in the response
      response.body.users.forEach((user) => {
        expect(user).not.toHaveProperty("apiKey");
        expect(user).toHaveProperty("userId");
        expect(user).toHaveProperty("createdAt");
      });
    });

    it("should require admin key", async () => {
      const response = await request(app).get("/admin/users");

      expect(response.status).toBe(403);
    });
  });

  describe("GET /admin/storage", () => {
    it("should return storage statistics", async () => {
      const response = await request(app)
        .get("/admin/storage")
        .set("x-admin-key", adminKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("count");
      expect(response.body).toHaveProperty("users");
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it("should require admin key", async () => {
      const response = await request(app).get("/admin/storage");

      expect(response.status).toBe(403);
    });
  });

  describe("PUT /admin/users/:userId", () => {
    beforeEach(async () => {
      // Create a user to update
      await request(app)
        .post("/admin/users")
        .set("x-admin-key", adminKey)
        .send({
          userId: "test-admin-update-user",
          displayName: "Original Name",
        });
    });

    it("should update user displayName", async () => {
      const response = await request(app)
        .put("/admin/users/test-admin-update-user")
        .set("x-admin-key", adminKey)
        .send({ displayName: "Updated Display Name" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.user.displayName).toBe("Updated Display Name");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .put("/admin/users/non-existent-user")
        .set("x-admin-key", adminKey)
        .send({ displayName: "Test" });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("not found");
    });

    it("should reject update without displayName", async () => {
      const response = await request(app)
        .put("/admin/users/test-admin-update-user")
        .set("x-admin-key", adminKey)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should require admin key", async () => {
      const response = await request(app)
        .put("/admin/users/test-admin-update-user")
        .send({ displayName: "Test" });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /admin/users/:userId", () => {
    beforeEach(async () => {
      // Create a user to delete
      await request(app)
        .post("/admin/users")
        .set("x-admin-key", adminKey)
        .send({ userId: "test-admin-delete-user", displayName: "Delete Me" });
    });

    it("should delete user", async () => {
      const response = await request(app)
        .delete("/admin/users/test-admin-delete-user")
        .set("x-admin-key", adminKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.message).toContain("deleted");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .delete("/admin/users/non-existent-user")
        .set("x-admin-key", adminKey);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("not found");
    });

    it("should require admin key", async () => {
      const response = await request(app).delete(
        "/admin/users/test-admin-delete-user"
      );

      expect(response.status).toBe(403);
    });

    it("should not be able to retrieve deleted user", async () => {
      // Delete user
      await request(app)
        .delete("/admin/users/test-admin-delete-user")
        .set("x-admin-key", adminKey);

      // Try to get users list
      const response = await request(app)
        .get("/admin/users")
        .set("x-admin-key", adminKey);

      expect(response.status).toBe(200);
      const deletedUser = response.body.users.find(
        (u) => u.userId === "test-admin-delete-user"
      );
      expect(deletedUser).toBeUndefined();
    });
  });

  describe("POST /admin/users/:userId/regenerate-key", () => {
    let testUserId;
    let originalApiKey;

    beforeEach(async () => {
      // Create a unique user for each test (keep it short for validation)
      const uniqueId = `regen-${Math.random().toString(36).substring(2, 15)}`;

      const createResponse = await request(app)
        .post("/admin/users")
        .set("x-admin-key", adminKey)
        .send({ userId: uniqueId, displayName: "Regen Test User" });

      testUserId = createResponse.body.user.userId;
      originalApiKey = createResponse.body.user.apiKey;
    });

    it("should regenerate API key for existing user", async () => {
      const response = await request(app)
        .post(`/admin/users/${testUserId}/regenerate-key`)
        .set("x-admin-key", adminKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("oldKeyPartial");
      expect(response.body.user).toHaveProperty("apiKey");
      expect(response.body.user.apiKey).not.toBe(originalApiKey);
      expect(response.body.user.apiKey).toMatch(/^[a-f0-9]{64}$/);
      expect(response.body.user).toHaveProperty("userId", testUserId);
      expect(response.body.user).toHaveProperty("keyRegeneratedAt");
    });

    it("should invalidate old API key after regeneration", async () => {
      // Regenerate key
      await request(app)
        .post(`/admin/users/${testUserId}/regenerate-key`)
        .set("x-admin-key", adminKey);

      // Try to use old key
      const response = await request(app)
        .get("/api/me")
        .set("x-api-key", originalApiKey);

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .post("/admin/users/non-existent-user/regenerate-key")
        .set("x-admin-key", adminKey);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("not found");
    });

    it("should require admin key", async () => {
      const response = await request(app).post(
        `/admin/users/${testUserId}/regenerate-key`
      );

      expect(response.status).toBe(403);
    });

    it("should show partial old key in response for reference", async () => {
      const response = await request(app)
        .post(`/admin/users/${testUserId}/regenerate-key`)
        .set("x-admin-key", adminKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("oldKeyPartial");
      expect(response.body.oldKeyPartial).toBe(originalApiKey.substring(0, 8));
      expect(response.body.oldKeyPartial.length).toBe(8);
    });
  });
});
