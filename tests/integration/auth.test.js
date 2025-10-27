const request = require("supertest");
const app = require("../../src/app");
const fs = require("fs").promises;
const path = require("path");

describe("Authentication Middleware", () => {
  describe("API Key Authentication", () => {
    it("should reject requests without API key", async () => {
      const response = await request(app).get("/api/players/all");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toContain("API key required");
    });

    it("should reject requests with invalid API key", async () => {
      const response = await request(app)
        .get("/api/players/all")
        .set("x-api-key", "invalid-key-123");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toContain("Invalid API key");
    });

    it("should accept valid API key in header", async () => {
      // Use API key from fixtures/test-users.json
      const response = await request(app)
        .get("/api/players/all")
        .set("x-api-key", "test-api-key-123456789");

      // Should not be 401 (might be 200 or 404 depending on data)
      expect(response.status).not.toBe(401);
    });

    it("should accept API key in query parameter", async () => {
      const response = await request(app).get(
        "/api/players/all?apiKey=test-api-key-123456789"
      );

      // Should not be 401
      expect(response.status).not.toBe(401);
    });
  });

  describe("Admin Key Authentication", () => {
    it("should reject admin requests without admin key", async () => {
      const response = await request(app)
        .post("/admin/users")
        .send({ username: "test" });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toContain("admin key");
    });

    it("should reject admin requests with invalid admin key", async () => {
      const response = await request(app)
        .post("/admin/users")
        .set("x-admin-key", "wrong-admin-key")
        .send({ username: "test" });

      expect(response.status).toBe(403);
    });

    it("should accept valid admin key", async () => {
      const response = await request(app)
        .post("/admin/users")
        .set("x-admin-key", process.env.ADMIN_KEY)
        .send({ username: "new-test-user" });

      // Should not be 403 (might be 200 or 400 depending on validation)
      expect(response.status).not.toBe(403);
    });

    it("should accept admin key in query parameter", async () => {
      const response = await request(app)
        .post(`/admin/users?adminKey=${process.env.ADMIN_KEY}`)
        .send({ username: "new-test-user-2" });

      // Should not be 403
      expect(response.status).not.toBe(403);
    });
  });
});
