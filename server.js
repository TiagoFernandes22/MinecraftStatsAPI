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
const WORLD_PATH = DEFAULT_WORLD_DIR; // Path to Minecraft world for map endpoint
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

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith(".json")) {
      cb(null, true);
    } else {
      cb(new Error("Only JSON files are allowed"));
    }
  },
});

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
async function readPlayerInventory(uuid) {
  try {
    const exists = await directoryExists(PLAYERDATA_DIR);
    if (!exists) {
      return { error: "Playerdata directory not found", inventory: [] };
    }

    // Try both with and without dashes
    const candidates = [`${uuid}.dat`, `${uuid.replace(/-/g, "")}.dat`];
    let datFile = null;

    for (const candidate of candidates) {
      const filePath = path.join(PLAYERDATA_DIR, candidate);
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

    for (const file of req.files) {
      try {
        // Read and parse JSON
        const content = await fs.readFile(file.path, "utf-8");
        const statsData = JSON.parse(content);

        // Extract UUID from filename
        const uuid = path.basename(file.filename, ".json");

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

        // Clean up uploaded file
        await fs.unlink(file.path);
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
 * List local stats files from configured STATS_DIR
 */
app.get("/api/local/files", async (req, res) => {
  try {
    const exists = await directoryExists(STATS_DIR);
    if (!exists) {
      return res.json({
        success: true,
        files: [],
        message: "Stats directory does not exist",
      });
    }
    const files = await listJsonFiles(STATS_DIR);
    // include file metadata
    const detailed = await Promise.all(
      files.map(async (name) => {
        const full = path.join(STATS_DIR, name);
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
 * Process all local stats files from STATS_DIR
 */
app.get("/api/local/stats", async (req, res) => {
  try {
    const exists = await directoryExists(STATS_DIR);
    if (!exists) {
      return res.json({ success: true, playerCount: 0, players: [] });
    }
    const files = await listJsonFiles(STATS_DIR);
    const results = [];
    for (const filename of files) {
      try {
        const result = await readPlayerStatsFromFile(STATS_DIR, filename);
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
 * Get single player's stats from STATS_DIR by UUID
 */
app.get("/api/local/player/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;
    const exists = await directoryExists(STATS_DIR);
    if (!exists) {
      return res.status(404).json({ error: "Stats directory not found" });
    }
    // Accept filenames with or without dashes; try both
    const candidates = [`${uuid}.json`, `${uuid.replace(/-/g, "")}.json`];
    const files = await listJsonFiles(STATS_DIR);
    const match = candidates.find((c) => files.includes(c));
    if (!match) {
      return res.status(404).json({ error: "Player stats file not found" });
    }
    const result = await readPlayerStatsFromFile(STATS_DIR, match);
    res.json(result);
  } catch (error) {
    console.error("Local player error:", error);
    res.status(500).json({ error: "Error reading local player stats" });
  }
});

/**
 * Get player inventory from PLAYERDATA_DIR by UUID
 */
app.get("/api/local/inventory/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;
    const inventoryData = await readPlayerInventory(uuid);

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
 * Get all local stats WITH inventory data included
 */
app.get("/api/local/stats-with-inventory", async (req, res) => {
  try {
    const exists = await directoryExists(STATS_DIR);
    if (!exists) {
      return res.json({ success: true, playerCount: 0, players: [] });
    }
    const files = await listJsonFiles(STATS_DIR);
    const results = [];
    for (const filename of files) {
      try {
        const result = await readPlayerStatsFromFile(STATS_DIR, filename);
        // Add inventory data
        const inventoryData = await readPlayerInventory(result.uuid);
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
    res.json({ success: true, playerCount: results.length, players: results });
  } catch (error) {
    console.error("Local stats with inventory error:", error);
    res.status(500).json({ error: "Error processing local stats" });
  }
});

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minecraft Stats API running on http://localhost:${PORT}`);
  console.log(`📊 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});
