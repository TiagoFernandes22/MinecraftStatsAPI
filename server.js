const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const axios = require("axios");
const nbt = require("prismarine-nbt");

// Load environment variables (e.g., STATS_DIR, PORT)
try {
  require("dotenv").config();
} catch (_) {
  // dotenv is optional; ignore if not installed
}

const app = express();
const PORT = process.env.PORT || 3000;
// Configurable local directories (defaults point to uploads/worlds/MyWorld)
const DEFAULT_WORLD_DIR = path.join(__dirname, "uploads", "worlds", "MyWorld");
// Where your world's stats .json files live
const DEFAULT_STATS_DIR = path.join(DEFAULT_WORLD_DIR, "stats");
const STATS_DIR = process.env.STATS_DIR
  ? path.isAbsolute(process.env.STATS_DIR)
    ? process.env.STATS_DIR
    : path.join(__dirname, process.env.STATS_DIR)
  : DEFAULT_STATS_DIR;

// Where your world's playerdata .dat files live
const DEFAULT_PLAYERDATA_DIR = path.join(DEFAULT_WORLD_DIR, "playerdata");
const PLAYERDATA_DIR = process.env.PLAYERDATA_DIR
  ? path.isAbsolute(process.env.PLAYERDATA_DIR)
    ? process.env.PLAYERDATA_DIR
    : path.join(__dirname, process.env.PLAYERDATA_DIR)
  : DEFAULT_PLAYERDATA_DIR;

// Middleware
app.use(cors());
app.use(express.json());

// Security & logging middlewares (quick production hardening)
try {
  const helmet = require("helmet");
  const morgan = require("morgan");
  const rateLimit = require("express-rate-limit");

  app.use(helmet());

  // Basic request logging
  app.use(morgan("combined"));

  // Basic rate limiting - safe defaults, tune for your deployment
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // limit each IP to 120 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply to all requests
  app.use(limiter);
} catch (e) {
  // If optional dependencies not installed, continue without them
  console.warn(
    "Optional security/logging middleware not available:",
    e.message
  );
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Limit upload size to avoid large file DoS. Adjust as needed.
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith(".json")) {
      cb(null, true);
    } else {
      cb(new Error("Only JSON files are allowed"));
    }
  },
});

// Separate multer config for world zip uploads (larger file size)
const uploadZip = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB for world zips
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith(".zip")) {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files are allowed"));
    }
  },
});

// Simple API key middleware: set API_KEYS env var to comma-separated keys
// Load users mapping from data/users.json (optional)
let usersList = [];
async function loadUsers() {
  try {
    const usersJson = await fs.readFile(
      path.join(__dirname, "data", "users.json"),
      "utf8"
    );
    const parsed = JSON.parse(usersJson);
    usersList = parsed.users || [];
  } catch (e) {
    // ignore if file doesn't exist
    usersList = [];
  }
}

// Immediately load users (fire-and-forget)
loadUsers();

// Quota helper: check user storage size (simple file-based quota)
async function checkUserQuota(userId) {
  const userDir = path.join(__dirname, "uploads", "worlds", userId);
  const maxSize = 500 * 1024 * 1024; // 500 MB default quota
  const maxFiles = 10000; // max file count

  try {
    const exists = await directoryExists(userDir);
    if (!exists) return { ok: true, size: 0, fileCount: 0 };

    // Recursively calculate directory size
    async function getDirSize(dir) {
      let size = 0;
      let fileCount = 0;
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const sub = await getDirSize(fullPath);
          size += sub.size;
          fileCount += sub.fileCount;
        } else {
          const stat = await fs.stat(fullPath);
          size += stat.size;
          fileCount++;
        }
      }
      return { size, fileCount };
    }

    const { size, fileCount } = await getDirSize(userDir);
    if (size > maxSize) {
      return {
        ok: false,
        reason: "Storage quota exceeded",
        size,
        maxSize,
        fileCount,
      };
    }
    if (fileCount > maxFiles) {
      return {
        ok: false,
        reason: "File count limit exceeded",
        size,
        fileCount,
        maxFiles,
      };
    }
    return { ok: true, size, fileCount };
  } catch (error) {
    console.error("Error checking quota:", error);
    return { ok: true, size: 0, fileCount: 0 }; // fail open
  }
}

function apiKeyMiddleware(req, res, next) {
  const auth = req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;

  // Check if we have explicit API_KEYS env var configured
  const apiKeys = (process.env.API_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  // If API_KEYS env var is set, use it (overrides users.json)
  if (apiKeys.length > 0) {
    if (!token) {
      return res.status(401).json({ error: "Unauthorized - missing API key" });
    }
    if (apiKeys.includes(token)) {
      // For env-based keys, use the key itself as userId (not ideal but simple)
      req.user = { userId: token, displayName: "api-key-user" };
      return next();
    }
    return res.status(401).json({ error: "Unauthorized - invalid API key" });
  }

  // Otherwise, use data/users.json for authentication
  if (!token) {
    return res.status(401).json({ error: "Unauthorized - missing API key" });
  }

  // Find user by API key in users.json
  const matched = usersList.find((u) => u.apiKey === token);
  if (!matched) {
    return res.status(401).json({ error: "Unauthorized - invalid API key" });
  }

  // Attach the actual userId from users.json
  req.user = { userId: matched.userId, displayName: matched.displayName };
  next();
}

// Apply API key middleware to write endpoints (uploads, process) - adjust routes as needed later
app.use(["/api/upload", "/api/process-directory"], apiKeyMiddleware);

// Helper: resolve user-specific world paths based on authentication
function getUserWorldPaths(req) {
  const userId = req.user && req.user.userId ? req.user.userId : "default";
  const userWorldDir = path.join(__dirname, "uploads", "worlds", userId);
  console.log(`Resolved world paths for user ${userId}: ${userWorldDir}`);
  return {
    worldDir: userWorldDir,
    statsDir: path.join(userWorldDir, "stats"),
    playerdataDir: path.join(userWorldDir, "playerdata"),
  };
}

// Cache for player data
const playerCache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Fetch player name and skin from Mojang API
 */
async function fetchPlayerProfile(uuid) {
  // Check cache first
  const cached = playerCache.get(uuid);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Remove dashes from UUID if present
    const cleanUuid = uuid.replace(/-/g, "");

    // Fetch profile from Mojang API
    const response = await axios.get(
      `https://sessionserver.mojang.com/session/minecraft/profile/${cleanUuid}`,
      { timeout: 5000 }
    );

    const profile = {
      uuid: uuid,
      name: response.data.name,
      skin: null,
      cape: null,
    };

    // Parse skin texture data
    if (response.data.properties) {
      const textureProperty = response.data.properties.find(
        (p) => p.name === "textures"
      );
      if (textureProperty) {
        const textures = JSON.parse(
          Buffer.from(textureProperty.value, "base64").toString()
        );
        if (textures.textures) {
          profile.skin = textures.textures.SKIN?.url || null;
          profile.cape = textures.textures.CAPE?.url || null;
        }
      }
    }

    // Cache the result
    playerCache.set(uuid, {
      data: profile,
      timestamp: Date.now(),
    });

    return profile;
  } catch (error) {
    console.error(`Error fetching profile for ${uuid}:`, error.message);

    // Return UUID as fallback
    return {
      uuid: uuid,
      name: uuid.substring(0, 8), // Shortened UUID as fallback
      skin: null,
      cape: null,
      error: "Could not fetch player data",
    };
  }
}

/**
 * Parse player stats from JSON content
 */
function parsePlayerStats(content) {
  return {
    stats: content.stats || {},
    dataVersion: content.DataVersion || 0,
  };
}

/**
 * Extract key statistics from player data
 */
function extractKeyStats(stats) {
  const customStats = stats["minecraft:custom"] || {};
  const mined = stats["minecraft:mined"] || {};
  const killed = stats["minecraft:killed"] || {};

  // Calculate totals
  const totalBlocksMined = Object.values(mined).reduce(
    (sum, val) => sum + val,
    0
  );
  const totalMobsKilled = Object.values(killed).reduce(
    (sum, val) => sum + val,
    0
  );

  return {
    playtime: Math.round((customStats["minecraft:play_time"] || 0) / 20 / 60), // minutes
    deaths: customStats["minecraft:deaths"] || 0,
    mobKills: customStats["minecraft:mob_kills"] || 0,
    playerKills: customStats["minecraft:player_kills"] || 0,
    blocksMined: totalBlocksMined,
    jumps: customStats["minecraft:jump"] || 0,
    distanceWalked: Math.round(
      (customStats["minecraft:walk_one_cm"] || 0) / 100
    ), // blocks
    distanceSprinted: Math.round(
      (customStats["minecraft:sprint_one_cm"] || 0) / 100
    ),
    distanceFlown: Math.round((customStats["minecraft:fly_one_cm"] || 0) / 100),
    damageTaken: customStats["minecraft:damage_taken"] || 0,
    damageDealt: customStats["minecraft:damage_dealt"] || 0,
    itemsEnchanted: customStats["minecraft:enchant_item"] || 0,
    animalsBreed: customStats["minecraft:animals_bred"] || 0,
    fishCaught: customStats["minecraft:fish_caught"] || 0,
  };
}

// Routes

// ---------- Local stats helpers ----------
async function directoryExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch (_) {
    return false;
  }
}

async function listJsonFiles(dirPath) {
  const exists = await directoryExists(dirPath);
  if (!exists) return [];
  const files = await fs.readdir(dirPath);
  return files.filter((f) => f.toLowerCase().endsWith(".json"));
}

async function readPlayerStatsFromFile(dirPath, filename) {
  const filePath = path.join(dirPath, filename);
  const content = await fs.readFile(filePath, "utf-8");
  const statsData = JSON.parse(content);
  const uuid = path.basename(filename, ".json");
  const playerStats = parsePlayerStats(statsData);
  const keyStats = extractKeyStats(playerStats.stats);
  const profile = await fetchPlayerProfile(uuid);
  return {
    uuid,
    name: profile.name,
    skin: profile.skin,
    cape: profile.cape,
    stats: keyStats,
    dataVersion: playerStats.dataVersion,
    rawStats: playerStats.stats,
  };
}

// ---------- Inventory parsing functions ----------
async function readPlayerInventory(uuid, customPlayerdataDir = null) {
  try {
    const targetDir = customPlayerdataDir || PLAYERDATA_DIR;
    const exists = await directoryExists(targetDir);
    if (!exists) {
      return { error: "Playerdata directory not found", inventory: [] };
    }

    // Try both with and without dashes
    const candidates = [`${uuid}.dat`, `${uuid.replace(/-/g, "")}.dat`];
    let datFile = null;

    for (const candidate of candidates) {
      const filePath = path.join(targetDir, candidate);
      try {
        await fs.access(filePath);
        datFile = filePath;
        break;
      } catch (_) {
        continue;
      }
    }

    if (!datFile) {
      return { error: "Player data file not found", inventory: [] };
    }

    const data = await fs.readFile(datFile);
    const { parsed, type } = await nbt.parse(data);

    console.log(`Parsing inventory for ${uuid}, NBT type: ${type}`);
    const rootData = parsed.value;

    if (!rootData) {
      return { error: "Invalid NBT structure", inventory: [] };
    }

    if (!rootData.Inventory) {
      return { error: "No inventory data in player file", inventory: [] };
    }

    const inventoryData = rootData.Inventory;
    let items;

    if (inventoryData.type === "list") {
      if (inventoryData.value && inventoryData.value.value) {
        items = inventoryData.value.value;
      } else if (Array.isArray(inventoryData.value)) {
        items = inventoryData.value;
      } else {
        items = Object.values(inventoryData.value);
      }
    } else {
      items = inventoryData.value;
    }

    if (!Array.isArray(items)) {
      return { error: "Invalid inventory format", inventory: [] };
    }

    const inventory = [];

    for (const item of items) {
      try {
        const itemValue = item.value || item;
        if (!itemValue || typeof itemValue !== "object") continue;

        const itemData = {
          slot: itemValue.Slot?.value ?? itemValue.Slot ?? -1,
          id: itemValue.id?.value ?? itemValue.id ?? "unknown",
          count:
            itemValue.Count?.value ??
            itemValue.Count ??
            itemValue.count?.value ??
            itemValue.count ??
            1,
          enchantments: [],
          customName: null,
        };

        // --- Parse Enchantments (New Format: components.minecraft:enchantments.levels) ---
        const components = itemValue.components?.value || itemValue.components;
        if (components && typeof components === "object") {
          const enchComp =
            components["minecraft:enchantments"]?.value ||
            components["minecraft:enchantments"];
          if (enchComp && typeof enchComp === "object") {
            const levels = enchComp.levels?.value || enchComp.levels;
            if (levels && typeof levels === "object") {
              // levels is an object with enchantment IDs as keys and level values
              for (const [enchId, enchLevel] of Object.entries(levels)) {
                const level = enchLevel?.value ?? enchLevel;
                itemData.enchantments.push({
                  id: enchId,
                  level: typeof level === "number" ? level : level?.value ?? 1,
                });
              }
            }
          }

          // Parse custom name from components
          const customNameComp =
            components["minecraft:custom_name"]?.value ||
            components["minecraft:custom_name"];
          if (customNameComp && typeof customNameComp === "string") {
            try {
              // Remove quotes if present
              const cleaned = customNameComp.replace(/^"|"$/g, "");
              itemData.customName = cleaned;
            } catch (_) {
              itemData.customName = customNameComp;
            }
          }
        }

        // --- Parse Enchantments (Old Format: tag.Enchantments) ---
        const tag = itemValue.tag?.value || itemValue.tag;
        if (
          tag &&
          typeof tag === "object" &&
          itemData.enchantments.length === 0
        ) {
          const enchContainer =
            tag.Enchantments ||
            tag.StoredEnchantments ||
            tag.value?.Enchantments ||
            tag.value?.StoredEnchantments;

          if (enchContainer) {
            const enchList =
              enchContainer.value?.value ||
              enchContainer.value ||
              (Array.isArray(enchContainer)
                ? enchContainer
                : Object.values(enchContainer));

            if (Array.isArray(enchList)) {
              for (const ench of enchList) {
                const enchValue = ench.value || ench;
                if (enchValue && typeof enchValue === "object") {
                  itemData.enchantments.push({
                    id: enchValue.id?.value ?? enchValue.id ?? "unknown",
                    level: enchValue.lvl?.value ?? enchValue.lvl ?? 1,
                  });
                }
              }
            }
          }

          // Parse display name from tag (old format)
          if (!itemData.customName) {
            const display = tag.display?.value || tag.display;
            if (display && display.Name) {
              const nameValue = display.Name.value || display.Name;
              if (typeof nameValue === "string") {
                try {
                  const nameJson = JSON.parse(nameValue);
                  itemData.customName =
                    nameJson.text ||
                    nameJson.translate ||
                    JSON.stringify(nameJson);
                } catch {
                  itemData.customName = nameValue;
                }
              }
            }
          }
        }

        inventory.push(itemData);
      } catch (itemError) {
        console.error(`Error parsing item:`, itemError.message);
      }
    }

    // Sort by slot for nicer output
    inventory.sort((a, b) => a.slot - b.slot);

    console.log(`Successfully parsed ${inventory.length} items`);
    return { inventory, totalItems: inventory.length };
  } catch (error) {
    console.error(`Error reading inventory for ${uuid}:`, error.message);
    console.error(error.stack);
    return { error: error.message, inventory: [] };
  }
}

// Helper: format item name
function formatItemName(itemId) {
  if (!itemId) return "Unknown";
  const cleaned = itemId.replace("minecraft:", "");
  return cleaned
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Get current authenticated user info
 */
app.get("/api/me", apiKeyMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({
    userId: req.user.userId,
    displayName: req.user.displayName,
  });
});

/**
 * API configuration and local directory status
 */
app.get("/api/config", async (req, res) => {
  try {
    const statsExists = await directoryExists(STATS_DIR);
    const statsFiles = statsExists ? await listJsonFiles(STATS_DIR) : [];
    const playerdataExists = await directoryExists(PLAYERDATA_DIR);
    res.json({
      port: PORT,
      statsDir: STATS_DIR,
      statsDirExists: statsExists,
      statsFileCount: statsFiles.length,
      defaultStatsDir: DEFAULT_STATS_DIR,
      playerdataDir: PLAYERDATA_DIR,
      playerdataDirExists: playerdataExists,
      defaultPlayerdataDir: DEFAULT_PLAYERDATA_DIR,
    });
  } catch (error) {
    res.status(500).json({ error: "Error reading config" });
  }
});

/**
 * Upload and process stats files
 */
app.post("/api/upload", upload.array("stats", 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const results = [];

    // Resolve user folder (if req.user set by middleware)
    const userId = req.user && req.user.userId ? req.user.userId : "default";

    // Check user quota before processing
    const quota = await checkUserQuota(userId);
    if (!quota.ok) {
      return res.status(413).json({
        error: quota.reason,
        currentSize: quota.size,
        maxSize: quota.maxSize,
        fileCount: quota.fileCount,
      });
    }

    const userStatsDir = path.join(
      __dirname,
      "uploads",
      "worlds",
      userId,
      "stats"
    );
    await fs.mkdir(userStatsDir, { recursive: true });

    for (const file of req.files) {
      try {
        // Move uploaded file to user-scoped folder before processing
        const safeName = path.basename(file.originalname);
        const destPath = path.join(userStatsDir, safeName);
        await fs.rename(file.path, destPath);

        // Read and parse JSON from user-scoped path
        const content = await fs.readFile(destPath, "utf-8");
        const statsData = JSON.parse(content);

        // Extract UUID from filename
        const uuid = path.basename(safeName, ".json");

        // Parse stats
        const playerStats = parsePlayerStats(statsData);
        const keyStats = extractKeyStats(playerStats.stats);

        // Fetch player profile (name and skin)
        const profile = await fetchPlayerProfile(uuid);

        results.push({
          uuid: uuid,
          name: profile.name,
          skin: profile.skin,
          cape: profile.cape,
          stats: keyStats,
          dataVersion: playerStats.dataVersion,
          rawStats: playerStats.stats, // Include full stats for detailed analysis
        });

        // Clean up uploaded file from user folder
        await fs.unlink(destPath);
      } catch (error) {
        console.error(`Error processing ${file.filename}:`, error);
      }
    }

    res.json({
      success: true,
      playerCount: results.length,
      players: results,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Error processing stats files" });
  }
});

/**
 * Process stats from a directory path (for local development)
 */
app.post("/api/process-directory", async (req, res) => {
  try {
    const { directoryPath } = req.body;

    if (!directoryPath) {
      return res.status(400).json({ error: "Directory path is required" });
    }

    // Read all JSON files from directory
    const files = await fs.readdir(directoryPath);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const results = [];

    for (const filename of jsonFiles) {
      try {
        const filePath = path.join(directoryPath, filename);
        const content = await fs.readFile(filePath, "utf-8");
        const statsData = JSON.parse(content);

        const uuid = path.basename(filename, ".json");
        const playerStats = parsePlayerStats(statsData);
        const keyStats = extractKeyStats(playerStats.stats);
        const profile = await fetchPlayerProfile(uuid);

        results.push({
          uuid: uuid,
          name: profile.name,
          skin: profile.skin,
          cape: profile.cape,
          stats: keyStats,
          dataVersion: playerStats.dataVersion,
          rawStats: playerStats.stats,
        });
      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
      }
    }

    res.json({
      success: true,
      playerCount: results.length,
      players: results,
    });
  } catch (error) {
    console.error("Directory processing error:", error);
    res.status(500).json({ error: "Error processing directory" });
  }
});

/**
 * Upload and extract a Minecraft world zip file
 * Requires authentication
 */
app.post("/api/upload/world", uploadZip.single("world"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No world zip file uploaded" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.userId;

    // Check user quota before extracting
    const quota = await checkUserQuota(userId);
    if (!quota.ok) {
      await fs.unlink(req.file.path);
      return res.status(413).json({
        error: quota.reason,
        currentSize: quota.size,
        maxSize: quota.maxSize,
        fileCount: quota.fileCount,
      });
    }

    const userWorldDir = path.join(__dirname, "uploads", "worlds", userId);

    // Extract the zip
    const AdmZip = require("adm-zip");
    const zip = new AdmZip(req.file.path);

    // Validate world structure: check for essential folders/files
    const entries = zip.getEntries();
    const hasRegion = entries.some((e) => e.entryName.includes("region/"));
    const hasLevelDat = entries.some((e) => e.entryName.endsWith("level.dat"));

    if (!hasRegion && !hasLevelDat) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: "Invalid world zip: missing region/ folder or level.dat",
        hint: "Make sure the zip contains a valid Minecraft world structure",
      });
    }

    // Extract to user's world folder
    await fs.mkdir(userWorldDir, { recursive: true });
    zip.extractAllTo(userWorldDir, true);

    // Clean up uploaded zip
    await fs.unlink(req.file.path);

    // Count extracted files
    const extractedEntries = entries.length;

    res.json({
      success: true,
      userId,
      worldPath: userWorldDir,
      extractedFiles: extractedEntries,
      message: "World uploaded and extracted successfully",
    });
  } catch (error) {
    console.error("World upload error:", error);
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
    }
    res
      .status(500)
      .json({ error: "Error uploading world", details: error.message });
  }
});

/**
 * List local stats files from configured STATS_DIR or user's stats directory
 */
app.get("/api/local/files", apiKeyMiddleware, async (req, res) => {
  try {
    // Use user-specific stats directory if authenticated
    const { statsDir } = getUserWorldPaths(req);
    const targetDir = statsDir;

    const exists = await directoryExists(targetDir);
    if (!exists) {
      return res.json({
        success: true,
        files: [],
        message: "Stats directory does not exist",
      });
    }
    const files = await listJsonFiles(targetDir);
    // include file metadata
    const detailed = await Promise.all(
      files.map(async (name) => {
        const full = path.join(targetDir, name);
        const stat = await fs.stat(full);
        return {
          filename: name,
          uuid: path.basename(name, ".json"),
          size: stat.size,
          modified: stat.mtime.toISOString(),
        };
      })
    );
    res.json({ success: true, count: detailed.length, files: detailed });
  } catch (error) {
    console.error("List local files error:", error);
    res.status(500).json({ error: "Error listing local files" });
  }
});

/**
 * Process all local stats files from user's stats directory
 */
app.get("/api/local/stats", apiKeyMiddleware, async (req, res) => {
  try {
    // Use user-specific stats directory if authenticated
    const { statsDir } = getUserWorldPaths(req);
    const targetDir = statsDir;

    const exists = await directoryExists(targetDir);
    if (!exists) {
      return res.json({ success: true, playerCount: 0, players: [] });
    }
    const files = await listJsonFiles(targetDir);
    const results = [];
    for (const filename of files) {
      try {
        const result = await readPlayerStatsFromFile(targetDir, filename);
        results.push(result);
      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
      }
    }
    res.json({ success: true, playerCount: results.length, players: results });
  } catch (error) {
    console.error("Local stats error:", error);
    res.status(500).json({ error: "Error processing local stats" });
  }
});

/**
 * Get single player's stats from user's stats directory by UUID
 */
app.get("/api/local/player/:uuid", apiKeyMiddleware, async (req, res) => {
  try {
    const { uuid } = req.params;
    // Use user-specific stats directory if authenticated
    const { statsDir } = getUserWorldPaths(req);
    const targetDir = statsDir;

    const exists = await directoryExists(targetDir);
    if (!exists) {
      return res.status(404).json({ error: "Stats directory not found" });
    }
    // Accept filenames with or without dashes; try both
    const candidates = [`${uuid}.json`, `${uuid.replace(/-/g, "")}.json`];
    const files = await listJsonFiles(targetDir);
    const match = candidates.find((c) => files.includes(c));
    if (!match) {
      return res.status(404).json({ error: "Player stats file not found" });
    }
    const result = await readPlayerStatsFromFile(targetDir, match);
    res.json(result);
  } catch (error) {
    console.error("Local player error:", error);
    res.status(500).json({ error: "Error reading local player stats" });
  }
});

/**
 * Get player inventory from user's playerdata directory by UUID
 */
app.get("/api/local/inventory/:uuid", apiKeyMiddleware, async (req, res) => {
  try {
    const { uuid } = req.params;
    // Use user-specific playerdata directory if authenticated
    const { playerdataDir } = getUserWorldPaths(req);
    const inventoryData = await readPlayerInventory(uuid, playerdataDir);

    if (inventoryData.error && inventoryData.inventory.length === 0) {
      return res.status(404).json(inventoryData);
    }

    // Format items for better readability
    const formattedInventory = inventoryData.inventory.map((item) => ({
      ...item,
      name: item.customName || formatItemName(item.id),
    }));

    res.json({
      success: true,
      uuid,
      totalItems: inventoryData.totalItems,
      inventory: formattedInventory,
    });
  } catch (error) {
    console.error("Inventory error:", error);
    res.status(500).json({ error: "Error reading player inventory" });
  }
});

/**
 * Get all local stats WITH inventory data included from user's directories
 */
app.get(
  "/api/local/stats-with-inventory",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      // Use user-specific directories if authenticated
      const { statsDir, playerdataDir } = getUserWorldPaths(req);

      const exists = await directoryExists(statsDir);
      if (!exists) {
        return res.json({ success: true, playerCount: 0, players: [] });
      }
      const files = await listJsonFiles(statsDir);
      const results = [];
      for (const filename of files) {
        try {
          const result = await readPlayerStatsFromFile(statsDir, filename);
          // Add inventory data from user's playerdata directory
          const inventoryData = await readPlayerInventory(
            result.uuid,
            playerdataDir
          );
          result.inventory = inventoryData.inventory.map((item) => ({
            ...item,
            name: formatItemName(item.id),
          }));
          result.inventoryCount = inventoryData.totalItems || 0;
          results.push(result);
        } catch (error) {
          console.error(`Error processing ${filename}:`, error);
        }
      }
      res.json({
        success: true,
        playerCount: results.length,
        players: results,
      });
    } catch (error) {
      console.error("Local stats with inventory error:", error);
      res.status(500).json({ error: "Error processing local stats" });
    }
  }
);

/**
 * Get player profile by UUID
 */
app.get("/api/player/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;
    const profile = await fetchPlayerProfile(uuid);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: "Error fetching player profile" });
  }
});

/**
 * Clear player cache
 */
app.post("/api/cache/clear", (req, res) => {
  playerCache.clear();
  res.json({ success: true, message: "Cache cleared" });
});

/**
 * Get cache statistics
 */
app.get("/api/cache/stats", (req, res) => {
  res.json({
    size: playerCache.size,
    players: Array.from(playerCache.keys()),
  });
});

/**
 * Admin: Create a new user and generate API key
 * Requires ADMIN_KEY env var
 */
app.post("/admin/users", async (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return res
      .status(503)
      .json({ error: "Admin endpoint not configured (ADMIN_KEY missing)" });
  }

  const auth = req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (token !== adminKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId, displayName } = req.body;
  if (!userId || !displayName) {
    return res.status(400).json({ error: "userId and displayName required" });
  }

  // Generate a secure random API key
  const crypto = require("crypto");
  const apiKey = crypto.randomBytes(32).toString("hex");

  try {
    // Load current users
    const usersPath = path.join(__dirname, "data", "users.json");
    let usersData = { users: [] };
    try {
      const content = await fs.readFile(usersPath, "utf8");
      usersData = JSON.parse(content);
    } catch (e) {
      // File doesn't exist yet
    }

    // Check if userId already exists
    if (usersData.users.find((u) => u.userId === userId)) {
      return res.status(409).json({ error: "userId already exists" });
    }

    // Add new user
    usersData.users.push({
      userId,
      apiKey,
      displayName,
      createdAt: new Date().toISOString(),
    });

    // Write back to file
    await fs.writeFile(usersPath, JSON.stringify(usersData, null, 2), "utf8");

    // Reload users in memory
    await loadUsers();

    res.json({
      success: true,
      userId,
      apiKey,
      displayName,
      message: "User created successfully. Save the API key securely.",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Minecraft Stats API running on http://localhost:${PORT}`);
  console.log(`Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
