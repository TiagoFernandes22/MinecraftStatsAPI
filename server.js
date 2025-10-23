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

// Apply API key middleware to process-directory endpoint
app.use("/api/process-directory", apiKeyMiddleware);

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
 * Optimized: removes "minecraft:" prefix from all stats
 */
function extractKeyStats(stats) {
  // Remove "minecraft:" prefix from all stat keys for cleaner data
  const cleanStats = {};
  for (const [category, values] of Object.entries(stats)) {
    const cleanCategory = category.replace("minecraft:", "");
    if (typeof values === "object" && values !== null) {
      cleanStats[cleanCategory] = {};
      for (const [key, val] of Object.entries(values)) {
        cleanStats[cleanCategory][key.replace("minecraft:", "")] = val;
      }
    } else {
      cleanStats[cleanCategory] = values;
    }
  }

  const customStats = cleanStats.custom || {};
  const mined = cleanStats.mined || {};
  const killed = cleanStats.killed || {};

  // Calculate totals (pre-computed for performance)
  const totalBlocksMined = Object.values(mined).reduce(
    (sum, val) => sum + val,
    0
  );
  const totalMobsKilled = Object.values(killed).reduce(
    (sum, val) => sum + val,
    0
  );

  return {
    playtime: Math.round((customStats.play_time || 0) / 20 / 60), // minutes
    deaths: customStats.deaths || 0,
    mobKills: customStats.mob_kills || 0,
    playerKills: customStats.player_kills || 0,
    blocksMined: totalBlocksMined,
    jumps: customStats.jump || 0,
    distanceWalked: Math.round((customStats.walk_one_cm || 0) / 100), // blocks
    distanceSprinted: Math.round((customStats.sprint_one_cm || 0) / 100),
    distanceFlown: Math.round((customStats.fly_one_cm || 0) / 100),
    damageTaken: customStats.damage_taken || 0,
    damageDealt: customStats.damage_dealt || 0,
    itemsEnchanted: customStats.enchant_item || 0,
    animalsBreed: customStats.animals_bred || 0,
    fishCaught: customStats.fish_caught || 0,
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

    // Try both with and without dashes, and also try .dat_old files
    const candidates = [
      `${uuid}.dat`,
      `${uuid.replace(/-/g, "")}.dat`,
      `${uuid}.dat_old`,
      `${uuid.replace(/-/g, "")}.dat_old`,
    ];
    let datFile = null;

    for (const candidate of candidates) {
      const filePath = path.join(targetDir, candidate);
      try {
        await fs.access(filePath);
        datFile = filePath;
        console.log(`Found player data file: ${candidate}`);
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
      console.log(`No root data found for ${uuid}`);
      return { error: "Invalid NBT structure", inventory: [] };
    }

    if (!rootData.Inventory) {
      console.log(
        `No Inventory field found for ${uuid}. Available fields:`,
        Object.keys(rootData)
      );
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
          id: (itemValue.id?.value ?? itemValue.id ?? "unknown").replace(
            "minecraft:",
            ""
          ),
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
                  id: enchId.replace("minecraft:", ""),
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
                    id: (
                      enchValue.id?.value ??
                      enchValue.id ??
                      "unknown"
                    ).replace("minecraft:", ""),
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

// Helper: format item name (optimized - prefix already removed)
function formatItemName(itemId) {
  if (!itemId) return "Unknown";
  // Remove prefix if still present (defensive)
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
app.get("/api/config", apiKeyMiddleware, async (req, res) => {
  try {
    const { statsDir, playerdataDir, worldDir } = getUserWorldPaths(req);
    const statsExists = await directoryExists(statsDir);
    const statsFiles = statsExists ? await listJsonFiles(statsDir) : [];
    const playerdataExists = await directoryExists(playerdataDir);
    res.json({
      port: PORT,
      userId: req.user.userId,
      displayName: req.user.displayName,
      statsDir: statsDir,
      statsDirExists: statsExists,
      statsFileCount: statsFiles.length,
      playerdataDir: playerdataDir,
      playerdataDirExists: playerdataExists,
      worldDir: worldDir,
    });
  } catch (error) {
    res.status(500).json({ error: "Error reading config" });
  }
});

/**
 * Upload and process stats files
 */
app.post(
  "/api/upload",
  apiKeyMiddleware,
  upload.array("stats", 100),
  async (req, res) => {
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
  }
);

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
app.post(
  "/api/upload/world",
  (req, res, next) => {
    uploadZip.single("world")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "File too large (max 100MB)" });
        }
        if (err.message === "Unexpected field") {
          return res.status(400).json({
            error: "Invalid field name. Expected field name: 'world'",
            hint: "In Postman, use form-data with key='world' (File type)",
          });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No world zip file uploaded" });
      }

      // Check authentication
      const auth = req.header("authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;

      if (!token) {
        await fs.unlink(req.file.path);
        return res
          .status(401)
          .json({ error: "Authentication required - missing API key" });
      }

      // Find user by API key
      const matched = usersList.find((u) => u.apiKey === token);
      if (!matched) {
        await fs.unlink(req.file.path);
        return res
          .status(401)
          .json({ error: "Authentication required - invalid API key" });
      }

      const userId = matched.userId;
      const userWorldDir = path.join(__dirname, "uploads", "worlds", userId);

      // Check if user already has a world
      const worldExists = await directoryExists(userWorldDir);
      if (worldExists) {
        await fs.unlink(req.file.path);
        return res.status(409).json({
          error: "World already exists",
          message:
            "You already have a world uploaded. Delete it first using DELETE /api/world before uploading a new one.",
          hint: "Use DELETE /api/world to remove your existing world data",
        });
      }

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

      // Extract the zip
      const AdmZip = require("adm-zip");
      const zip = new AdmZip(req.file.path);

      // Get entries for file count
      const entries = zip.getEntries();

      // Validate world structure: check for stats and/or playerdata folders
      const hasStats = entries.some((e) => e.entryName.includes("stats/"));
      const hasPlayerdata = entries.some((e) =>
        e.entryName.includes("playerdata/")
      );

      if (!hasStats && !hasPlayerdata) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          error: "Invalid world zip: missing stats/ or playerdata/ folders",
          hint: "Make sure the zip contains at least one of: stats/ folder (with .json files) or playerdata/ folder (with .dat files)",
        });
      }

      // Extract to user's world folder
      await fs.mkdir(userWorldDir, { recursive: true });

      // Check if all files are nested in a single root folder
      const rootFolders = new Set();
      entries.forEach((entry) => {
        const parts = entry.entryName.split("/");
        if (parts.length > 1) {
          rootFolders.add(parts[0]);
        }
      });

      // If everything is in a single root folder, extract its contents directly
      if (rootFolders.size === 1) {
        const rootFolder = Array.from(rootFolders)[0];
        console.log(
          `Detected root folder: ${rootFolder}, extracting contents directly`
        );

        // Extract each entry synchronously
        for (const entry of entries) {
          // Skip the root folder itself and extract only its contents
          if (entry.entryName.startsWith(rootFolder + "/")) {
            const relativePath = entry.entryName.substring(
              rootFolder.length + 1
            );
            if (relativePath) {
              const targetPath = path.join(userWorldDir, relativePath);
              if (entry.isDirectory) {
                await fs.mkdir(targetPath, { recursive: true });
              } else {
                const dir = path.dirname(targetPath);
                await fs.mkdir(dir, { recursive: true });
                // Extract the file data and write it
                const fileData = entry.getData();
                await fs.writeFile(targetPath, fileData);
              }
            }
          }
        }
      } else {
        // Extract normally if no single root folder
        zip.extractAllTo(userWorldDir, true);
      }

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
  }
);

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

    // PERFORMANCE IMPROVEMENT: Process all players in parallel
    const results = await Promise.all(
      files.map(async (filename) => {
        try {
          return await readPlayerStatsFromFile(targetDir, filename);
        } catch (error) {
          console.error(`Error processing ${filename}:`, error);
          return null;
        }
      })
    );

    // Filter out null values (errors)
    const filteredResults = results.filter((r) => r !== null);

    res.json({
      success: true,
      playerCount: filteredResults.length,
      players: filteredResults,
    });
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
      const { statsDir, playerdataDir, worldDir } = getUserWorldPaths(req);

      const exists = await directoryExists(statsDir);
      if (!exists) {
        return res.json({ success: true, playerCount: 0, players: [] });
      }

      // Load player filter settings
      const filterPath = path.join(worldDir, "player-filter.json");
      let hiddenPlayers = [];
      try {
        const filterData = await fs.readFile(filterPath, "utf-8");
        const filter = JSON.parse(filterData);
        hiddenPlayers = filter.hiddenPlayers || [];
      } catch (error) {
        // No filter file exists yet, use empty array
        console.log("No player filter found or error reading it");
      }

      const files = await listJsonFiles(statsDir);

      // PERFORMANCE IMPROVEMENT: Process all players in parallel
      const results = await Promise.all(
        files.map(async (filename) => {
          try {
            const result = await readPlayerStatsFromFile(statsDir, filename);

            // Skip hidden players
            if (hiddenPlayers.includes(result.uuid)) {
              return null;
            }

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
            return result;
          } catch (error) {
            console.error(`Error processing ${filename}:`, error);
            return null;
          }
        })
      );

      // Filter out null values (errors and hidden players)
      const filteredResults = results.filter((r) => r !== null);

      res.json({
        success: true,
        playerCount: filteredResults.length,
        players: filteredResults,
      });
    } catch (error) {
      console.error("Local stats with inventory error:", error);
      res.status(500).json({ error: "Error processing local stats" });
    }
  }
);

/**
 * Get player profile by UUID (Mojang API lookup)
 * Only allows lookup of players that exist in the authenticated user's world
 */
app.get("/api/player/:uuid", apiKeyMiddleware, async (req, res) => {
  try {
    const { uuid } = req.params;
    const { statsDir, playerdataDir } = getUserWorldPaths(req);

    // Check if player exists in user's world (either stats or playerdata)
    const statsExists = await directoryExists(statsDir);
    const playerdataExists = await directoryExists(playerdataDir);

    let playerFound = false;

    // Check stats directory
    if (statsExists) {
      const statsFiles = await listJsonFiles(statsDir);
      const candidates = [`${uuid}.json`, `${uuid.replace(/-/g, "")}.json`];
      playerFound = candidates.some((c) => statsFiles.includes(c));
    }

    // If not found in stats, check playerdata directory
    if (!playerFound && playerdataExists) {
      const playerdataFiles = await fs.readdir(playerdataDir);
      const candidates = [
        `${uuid}.dat`,
        `${uuid.replace(/-/g, "")}.dat`,
        `${uuid}.dat_old`,
        `${uuid.replace(/-/g, "")}.dat_old`,
      ];
      playerFound = candidates.some((c) => playerdataFiles.includes(c));
    }

    if (!playerFound) {
      return res.status(404).json({
        error: "Player not found in your world",
        hint: "This player does not exist in your uploaded world data",
      });
    }

    // Player exists in user's world, fetch from Mojang
    const profile = await fetchPlayerProfile(uuid);
    res.json(profile);
  } catch (error) {
    console.error("Player lookup error:", error);
    res.status(500).json({ error: "Error fetching player profile" });
  }
});

/**
 * Delete user's world data
 * Removes all world files (stats, playerdata, etc.) for the authenticated user
 */
app.delete("/api/world", apiKeyMiddleware, async (req, res) => {
  try {
    const { worldDir } = getUserWorldPaths(req);
    const userId = req.user.userId;

    // Check if world exists
    const exists = await directoryExists(worldDir);
    if (!exists) {
      return res.status(404).json({
        error: "No world found",
        message: "You don't have any world data to delete",
      });
    }

    // Recursively delete the entire user world directory
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

    await deleteDirectory(worldDir);

    res.json({
      success: true,
      message: "World deleted successfully",
      userId: userId,
    });
  } catch (error) {
    console.error("World deletion error:", error);
    res.status(500).json({
      error: "Error deleting world",
      details: error.message,
    });
  }
});

/**
 * Clear player cache
 */
app.post("/api/cache/clear", apiKeyMiddleware, (req, res) => {
  playerCache.clear();
  res.json({ success: true, message: "Cache cleared" });
});

/**
 * Get cache statistics
 */
app.get("/api/cache/stats", apiKeyMiddleware, (req, res) => {
  res.json({
    size: playerCache.size,
    players: Array.from(playerCache.keys()),
  });
});

/**
 * Get user's player filter settings
 * Returns list of hidden player UUIDs
 */
app.get("/api/players/filter", apiKeyMiddleware, async (req, res) => {
  try {
    const { worldDir } = getUserWorldPaths(req);
    const filterPath = path.join(worldDir, "player-filter.json");

    try {
      const data = await fs.readFile(filterPath, "utf-8");
      const filter = JSON.parse(data);
      res.json(filter);
    } catch (error) {
      // File doesn't exist yet, return empty filter
      res.json({ hiddenPlayers: [] });
    }
  } catch (error) {
    console.error("Error reading player filter:", error);
    res.status(500).json({
      error: "Error reading player filter",
      details: error.message,
    });
  }
});

/**
 * Get ALL players (unfiltered) for player management
 * Returns all players including those marked as hidden
 */
app.get("/api/players/all", apiKeyMiddleware, async (req, res) => {
  try {
    const { statsDir, playerdataDir } = getUserWorldPaths(req);

    const exists = await directoryExists(statsDir);
    if (!exists) {
      return res.json({ success: true, playerCount: 0, players: [] });
    }

    const files = await listJsonFiles(statsDir);

    // PERFORMANCE IMPROVEMENT: Process all players in parallel
    const results = await Promise.all(
      files.map(async (filename) => {
        try {
          const result = await readPlayerStatsFromFile(statsDir, filename);
          // Add inventory data
          const inventoryData = await readPlayerInventory(
            result.uuid,
            playerdataDir
          );
          result.inventory = inventoryData.inventory.map((item) => ({
            ...item,
            name: formatItemName(item.id),
          }));
          result.inventoryCount = inventoryData.totalItems || 0;
          return result;
        } catch (error) {
          console.error(`Error processing ${filename}:`, error);
          return null;
        }
      })
    );

    // Filter out null values (errors)
    const filteredResults = results.filter((r) => r !== null);

    res.json({
      success: true,
      playerCount: filteredResults.length,
      players: filteredResults,
    });
  } catch (error) {
    console.error("Error fetching all players:", error);
    res.status(500).json({ error: "Error fetching players" });
  }
});

/**
 * Update user's player filter settings
 * Body: { hiddenPlayers: ["uuid1", "uuid2", ...] }
 */
app.post("/api/players/filter", apiKeyMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if body exists
    if (!req.body) {
      return res.status(400).json({
        error: "Request body is missing",
        hint: "Make sure Content-Type is application/json",
      });
    }

    const { hiddenPlayers } = req.body;

    if (hiddenPlayers === undefined) {
      return res.status(400).json({
        error: "hiddenPlayers field is required",
        example: { hiddenPlayers: ["uuid1", "uuid2"] },
      });
    }

    if (!Array.isArray(hiddenPlayers)) {
      return res.status(400).json({
        error: "hiddenPlayers must be an array",
        example: { hiddenPlayers: ["uuid1", "uuid2"] },
      });
    }

    const worldDir = path.join(__dirname, "uploads", "worlds", userId);
    const filterPath = path.join(worldDir, "player-filter.json");

    // Ensure world directory exists
    await fs.mkdir(worldDir, { recursive: true });

    // Save filter settings
    const filterData = {
      hiddenPlayers: hiddenPlayers,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filterPath, JSON.stringify(filterData, null, 2));

    res.json({
      success: true,
      message: "Player filter updated",
      hiddenCount: hiddenPlayers.length,
    });
  } catch (error) {
    console.error("Error saving player filter:", error);
    res.status(500).json({
      error: "Error saving player filter",
      details: error.message,
    });
  }
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
