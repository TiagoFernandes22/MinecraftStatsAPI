// Global test setup - THIS RUNS BEFORE ALL TESTS
process.env.NODE_ENV = "test";
process.env.PORT = 3001;
process.env.ADMIN_KEY = "test-admin-key-123";

const fs = require("fs");
const path = require("path");

// Setup test users file IMMEDIATELY
const testUsersPath = path.join(__dirname, "../data/users.test.json");
const fixtureUsersPath = path.join(__dirname, "fixtures/test-users.json");

// Create test users file from fixtures SYNCHRONOUSLY
try {
  const fixtureData = fs.readFileSync(fixtureUsersPath, "utf-8");
  fs.writeFileSync(testUsersPath, fixtureData, "utf-8");
  console.log("✓ Created test users file");
} catch (error) {
  console.error("✗ Error creating test users file:", error);
  throw error;
}

// Override constants path BEFORE any test code runs
const constants = require("../src/config/constants");
constants.PATHS.USERS_FILE = testUsersPath;
console.log("✓ Overridden users file path to:", testUsersPath);

// Global cleanup after all tests
afterAll(() => {
  try {
    // Remove test users file
    if (fs.existsSync(testUsersPath)) {
      fs.unlinkSync(testUsersPath);
      console.log("✓ Cleaned up test users file");
    }
  } catch (error) {
    console.error("✗ Error cleaning up test users file:", error);
  }
});

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
