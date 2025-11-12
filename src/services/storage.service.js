const fs = require("fs").promises;
const path = require("path");
const { getDirectorySize, listJsonFiles } = require("../utils/helpers");
const { STORAGE_QUOTAS, FILE_LIMITS } = require("../config/constants");
const userService = require("./user.service");

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
   * Format bytes to human readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0.00 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      const users = [];

      for (const userId of userDirs) {
        const userWorldDir = path.join(worldsDir, userId);
        const stat = await fs.stat(userWorldDir);

        if (stat.isDirectory()) {
          const userStats = await this.getUserStorageStats(userWorldDir);
          if (userStats) {
            const usedBytes = userStats.used.bytes;
            const quotaBytes = userStats.limits.bytes;
            const remainingBytes = quotaBytes - usedBytes;
            const percentage = Math.round((usedBytes / quotaBytes) * 100);
            const userInfo = await userService.loadUser(userId);
            
            users.push({
              userId: userId,
              displayName: userInfo ? userInfo.displayName : userId,
              storage: {
                used: {
                  bytes: usedBytes,
                  readable: this.formatBytes(usedBytes)
                },
                quota: {
                  bytes: quotaBytes,
                  readable: this.formatBytes(quotaBytes)
                },
                usage: {
                  percentage: percentage,
                  remaining: this.formatBytes(remainingBytes)
                },
                files: {
                  count: userStats.used.files,
                  limit: userStats.limits.files
                }
              }
            });
          }
        }
      }

      return users;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return [];
    }
  }
}

module.exports = new StorageService();
