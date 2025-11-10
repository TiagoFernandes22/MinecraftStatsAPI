const fs = require("fs").promises;
const path = require("path");
const { PATHS } = require("../config/constants");

class UserService {
  async loadUser(userId) {
    try {
      const content = await fs.readFile(PATHS.USERS_FILE, "utf-8");
      const data = JSON.parse(content);
      if (!data.users || !Array.isArray(data.users)) {
        return null;
      }
      return data.users?.find(user => user.userId === userId) || null;
    } catch (error) {
      console.error("Error loading user:", error);
      return null;
    }
  }

  async loadUsers() {
    try {
      const content = await fs.readFile(PATHS.USERS_FILE, "utf-8");
      const data = JSON.parse(content);
      return data.users || [];
    } catch (error) {
      console.error("Error loading users:", error);
      return [];
    }
  }

  async validateApiKey(apiKey) {
    const users = await this.loadUsers();
    return users.find((u) => u.apiKey === apiKey) || null;
  }

  async createUser(userId, displayName) {
    const users = await this.loadUsers();

    // Check if user already exists (check both userId and username for compatibility)
    if (users.find((u) => u.userId === userId || u.username === userId)) {
      return {
        success: false,
        error: "User with this userId already exists",
      };
    }

    // Generate secure API key
    const crypto = require("crypto");
    const apiKey = crypto.randomBytes(32).toString("hex");

    const newUser = {
      userId: userId,
      apiKey,
      displayName: displayName || userId, // Use userId as default if displayName not provided
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    await fs.writeFile(
      PATHS.USERS_FILE,
      JSON.stringify({ users }, null, 2),
      "utf-8"
    );

    return {
      success: true,
      message: "User created successfully",
      user: {
        userId: newUser.userId,
        displayName: newUser.displayName,
        apiKey: newUser.apiKey,
        createdAt: newUser.createdAt,
      },
    };
  }

  async updateUser(username, updates) {
    const users = await this.loadUsers();
    const userIndex = users.findIndex(
      (u) => u.userId === username || u.username === username
    );

    if (userIndex === -1) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Update allowed fields
    if (updates.displayName !== undefined) {
      users[userIndex].displayName = updates.displayName;
    }

    users[userIndex].updatedAt = new Date().toISOString();

    await fs.writeFile(
      PATHS.USERS_FILE,
      JSON.stringify({ users }, null, 2),
      "utf-8"
    );

    return {
      success: true,
      message: "User updated successfully",
      user: {
        userId: users[userIndex].userId || users[userIndex].username,
        displayName: users[userIndex].displayName,
        apiKey: users[userIndex].apiKey,
        createdAt: users[userIndex].createdAt,
        updatedAt: users[userIndex].updatedAt,
      },
    };
  }

  async deleteUser(username) {
    const users = await this.loadUsers();
    const userIndex = users.findIndex(
      (u) => u.userId === username || u.username === username
    );

    if (userIndex === -1) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);

    await fs.writeFile(
      PATHS.USERS_FILE,
      JSON.stringify({ users }, null, 2),
      "utf-8"
    );

    return {
      success: true,
      message: "User deleted successfully",
      userId: deletedUser.userId || deletedUser.username,
    };
  }

  async regenerateApiKey(username) {
    const users = await this.loadUsers();
    const userIndex = users.findIndex(
      (u) => u.userId === username || u.username === username
    );

    if (userIndex === -1) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Generate new secure API key
    const crypto = require("crypto");
    const newApiKey = crypto.randomBytes(32).toString("hex");

    // Store old key for reference in response
    const oldApiKey = users[userIndex].apiKey;

    // Update user with new API key
    users[userIndex].apiKey = newApiKey;
    users[userIndex].keyRegeneratedAt = new Date().toISOString();

    await fs.writeFile(
      PATHS.USERS_FILE,
      JSON.stringify({ users }, null, 2),
      "utf-8"
    );

    return {
      success: true,
      message:
        "API key regenerated successfully. Please update your applications with the new key.",
      user: {
        userId: users[userIndex].userId || users[userIndex].username,
        displayName: users[userIndex].displayName,
        apiKey: newApiKey,
        oldApiKey: oldApiKey.substring(0, 8) + "...", // Show first 8 chars only for security
        createdAt: users[userIndex].createdAt,
        keyRegeneratedAt: users[userIndex].keyRegeneratedAt,
      },
    };
  }

  getUserWorldPaths(username) {
    const worldDir = path.join(PATHS.UPLOADS_DIR, username);
    return {
      username,
      worldDir,
      statsDir: path.join(worldDir, "stats"),
      playerdataDir: path.join(worldDir, "playerdata"),
    };
  }

  /**
   * Load player filter settings from user's world directory
   * Returns list of hidden player UUIDs
   */
  async loadPlayerFilter(worldDir) {
    try {
      const filterPath = path.join(worldDir, "player-filter.json");
      const filterData = await fs.readFile(filterPath, "utf-8");
      const filter = JSON.parse(filterData);
      return filter.hiddenPlayers || [];
    } catch (error) {
      // No filter file exists or error reading it, return empty array
      return [];
    }
  }

  /**
   * Save player filter settings to user's world directory
   */
  async savePlayerFilter(username, hiddenPlayers) {
    try {
      const { worldDir } = this.getUserWorldPaths(username);
      const filterPath = path.join(worldDir, "player-filter.json");

      // Ensure world directory exists
      await fs.mkdir(worldDir, { recursive: true });

      // Save filter settings
      const filterData = {
        hiddenPlayers: hiddenPlayers,
        updatedAt: new Date().toISOString(),
      };

      await fs.writeFile(filterPath, JSON.stringify(filterData, null, 2));

      return {
        success: true,
        message: "Player filter updated",
        hiddenCount: hiddenPlayers.length,
      };
    } catch (error) {
      console.error("Error saving player filter:", error);
      return {
        success: false,
        error: "Error saving player filter",
        details: error.message,
      };
    }
  }
}

module.exports = new UserService();
