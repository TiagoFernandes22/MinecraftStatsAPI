const fs = require("fs").promises;
const path = require("path");
const AdmZip = require("adm-zip");
const { deleteDirectory, getDirectorySize } = require("../utils/helpers");
const { PATHS, FILE_LIMITS } = require("../config/constants");

class WorldService {
  /**
   * Upload and extract world data
   */
  async uploadWorld(username, buffer) {
    const userWorldDir = path.join(PATHS.UPLOADS_DIR, "worlds", username);
    const statsDir = path.join(userWorldDir, "stats");
    const playerdataDir = path.join(userWorldDir, "playerdata");

    // Delete existing world data
    try {
      await deleteDirectory(userWorldDir);
    } catch (error) {
      // Directory might not exist, continue
    }

    // Create directories
    await fs.mkdir(statsDir, { recursive: true });
    await fs.mkdir(playerdataDir, { recursive: true });

    // Extract zip
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      const normalizedPath = entry.entryName.replace(/\\/g, "/");

      if (
        normalizedPath.includes("/stats/") &&
        normalizedPath.endsWith(".json")
      ) {
        const filename = path.basename(normalizedPath);
        const outputPath = path.join(statsDir, filename);
        await fs.writeFile(outputPath, entry.getData());
      } else if (
        normalizedPath.includes("/playerdata/") &&
        normalizedPath.endsWith(".dat")
      ) {
        const filename = path.basename(normalizedPath);
        const outputPath = path.join(playerdataDir, filename);
        await fs.writeFile(outputPath, entry.getData());
      } else if (
        normalizedPath.includes("/playerdata/") &&
        normalizedPath.endsWith(".dat_old")
      ) {
        const filename = path.basename(normalizedPath);
        const outputPath = path.join(playerdataDir, filename);
        await fs.writeFile(outputPath, entry.getData());
      }
    }

    // Get final size
    const totalSize = await getDirectorySize(userWorldDir);

    return {
      success: true,
      message: "World uploaded and extracted successfully",
      path: userWorldDir,
      sizeBytes: totalSize,
    };
  }

  /**
   * Delete world data
   */
  async deleteWorld(username) {
    const userWorldDir = path.join(PATHS.UPLOADS_DIR, "worlds", username);

    try {
      await fs.access(userWorldDir);
    } catch {
      return {
        success: false,
        error: "World not found",
      };
    }

    await deleteDirectory(userWorldDir);

    return {
      success: true,
      message: "World deleted successfully",
    };
  }

  /**
   * Get world info
   */
  async getWorldInfo(username) {
    const userWorldDir = path.join(PATHS.UPLOADS_DIR, "worlds", username);

    try {
      await fs.access(userWorldDir);
    } catch {
      return null;
    }

    const statsDir = path.join(userWorldDir, "stats");
    const playerdataDir = path.join(userWorldDir, "playerdata");

    const [statsFiles, playerdataFiles, totalSize] = await Promise.all([
      fs.readdir(statsDir).catch(() => []),
      fs.readdir(playerdataDir).catch(() => []),
      getDirectorySize(userWorldDir),
    ]);

    return {
      username,
      path: userWorldDir,
      statsCount: statsFiles.filter((f) => f.endsWith(".json")).length,
      playerdataCount: playerdataFiles.filter(
        (f) => f.endsWith(".dat") || f.endsWith(".dat_old")
      ).length,
      sizeBytes: totalSize,
    };
  }
}

module.exports = new WorldService();
