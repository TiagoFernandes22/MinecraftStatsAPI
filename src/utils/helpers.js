const fs = require("fs").promises;
const path = require("path");

/**
 * Check if a directory exists
 */
async function directoryExists(dir) {
  try {
    const stats = await fs.stat(dir);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * List all JSON files in a directory
 */
async function listJsonFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
}

/**
 * Get directory size recursively
 */
async function getDirectorySize(dir) {
  let totalSize = 0;
  let fileCount = 0;

  async function traverse(currentPath) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
          fileCount++;
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentPath}:`, error);
    }
  }

  await traverse(dir);
  return { totalSize, fileCount };
}

/**
 * Delete directory recursively
 */
async function deleteDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await deleteDirectory(fullPath);
    } else {
      await fs.unlink(fullPath);
    }
  }
  await fs.rmdir(dir);
}

/**
 * Format item name from ID
 */
function formatItemName(id) {
  if (!id || id === "") return "Unknown";

  // Remove minecraft: prefix if present
  const cleaned = id.replace(/^minecraft:/i, "");

  return cleaned
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  if (!filename) return "";
  return filename.replace(/[^a-zA-Z0-9._-]/g, "");
}

module.exports = {
  directoryExists,
  fileExists,
  listJsonFiles,
  getDirectorySize,
  deleteDirectory,
  formatItemName,
  sanitizeFilename,
};
