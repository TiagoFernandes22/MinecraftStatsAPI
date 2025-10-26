const fs = require("fs").promises;
const path = require("path");
const { getDirectorySize, listJsonFiles } = require("../utils/helpers");
const { STORAGE_QUOTAS, FILE_LIMITS } = require("../config/constants");

class StorageService {
  /**
   * Check if user has exceeded storage quota
   */
  async checkStorageQuota(userWorldDir) {
    try {
      const { totalSize, fileCount } = await getDirectorySize(userWorldDir);

      return {
        sizeBytes: totalSize,
        fileCount: fileCount,
        withinSizeLimit: totalSize <= STORAGE_QUOTAS.MAX_TOTAL_SIZE,
        withinFileLimit: fileCount <= STORAGE_QUOTAS.MAX_FILE_COUNT,
        exceeded:
          totalSize > STORAGE_QUOTAS.MAX_TOTAL_SIZE ||
          fileCount > STORAGE_QUOTAS.MAX_FILE_COUNT,
      };
    } catch (error) {
      return {
        sizeBytes: 0,
        fileCount: 0,
        withinSizeLimit: true,
        withinFileLimit: true,
        exceeded: false,
      };
    }
  }

  /**
   * Validate file size
   */
  validateFileSize(fileSize, maxSize = FILE_LIMITS.MAX_JSON_SIZE) {
    return fileSize <= maxSize;
  }

  /**
   * Get storage stats for a user
   */
  async getUserStorageStats(userWorldDir) {
    try {
      const quota = await this.checkStorageQuota(userWorldDir);

      return {
        used: {
          bytes: quota.sizeBytes,
          files: quota.fileCount,
        },
        limits: {
          bytes: STORAGE_QUOTAS.MAX_TOTAL_SIZE,
          files: STORAGE_QUOTAS.MAX_FILE_COUNT,
        },
        percentage: {
          bytes: (
            (quota.sizeBytes / STORAGE_QUOTAS.MAX_TOTAL_SIZE) *
            100
          ).toFixed(2),
          files: (
            (quota.fileCount / STORAGE_QUOTAS.MAX_FILE_COUNT) *
            100
          ).toFixed(2),
        },
        exceeded: quota.exceeded,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all users storage overview
   */
  async getAllUsersStorageStats(uploadsDir) {
    const worldsDir = path.join(uploadsDir);

    try {
      const userDirs = await fs.readdir(worldsDir);
      const stats = [];

      for (const username of userDirs) {
        const userWorldDir = path.join(worldsDir, username);
        const stat = await fs.stat(userWorldDir);

        if (stat.isDirectory()) {
          const userStats = await this.getUserStorageStats(userWorldDir);
          if (userStats) {
            stats.push({
              username,
              ...userStats,
            });
          }
        }
      }

      return stats;
    } catch (error) {
      return [];
    }
  }
}

module.exports = new StorageService();
