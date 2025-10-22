# Minecraft Stats API

A Node.js/Express API server that processes Minecraft server stats files and provides player information including names, skins, and formatted statistics data.

## Features

- **File Upload** - Accept stats JSON files via multipart/form-data
- **Player Profiles** - Fetch player names and skins from Mojang API
- **Stats Processing** - Parse and format all Minecraft statistics
- **Caching** - Cache player profiles to reduce API calls
- **CORS Enabled** - Works with your Vue frontend

## API Endpoints

### System & Configuration

#### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T12:00:00.000Z"
}
```

#### `GET /api/config`
Show API configuration including configured directories.

**Response:**
```json
{
  "port": 3000,
  "statsDir": "C:/path/to/stats",
  "statsDirExists": true,
  "statsFileCount": 4,
  "defaultStatsDir": "<repo>/uploads/worlds/MyWorld/stats",
  "playerdataDir": "C:/path/to/playerdata",
  "playerdataDirExists": true,
  "defaultPlayerdataDir": "<repo>/uploads/worlds/MyWorld/playerdata"
}
```

### Player Stats Endpoints

#### `GET /api/stats/files`
List all JSON stats files found in the configured stats directory with metadata.

**Response:**
```json
{
  "success": true,
  "count": 4,
  "files": [
    {
      "filename": "uuid.json",
      "uuid": "uuid",
      "size": 12345,
      "modified": "2025-10-18T12:00:00.000Z"
    }
  ]
}
```

#### `GET /api/local/stats`
Get all players with their parsed statistics from the local stats directory.

**Response:**
```json
{
  "success": true,
  "playerCount": 3,
  "players": [
    {
      "uuid": "12345678-1234-1234-1234-123456789abc",
      "name": "PlayerName",
      "skin": "https://textures.minecraft.net/texture/...",
      "cape": null,
      "stats": {
        "playtime": 1234,
        "deaths": 10,
        "mobKills": 500,
        "playerKills": 5,
        "blocksMined": 5000,
        "jumps": 1000,
        "distanceWalked": 50000,
        "distanceSprinted": 20000,
        "distanceFlown": 1000,
        "damageTaken": 500,
        "damageDealt": 1000,
        "itemsEnchanted": 10,
        "animalsBreed": 20,
        "fishCaught": 15
      },
      "dataVersion": 3465,
      "rawStats": { /* full stats object */ }
    }
  ]
}
```

#### `GET /api/local/player/:uuid`
Get a single player's statistics by UUID from local stats directory.

**Response:** Same player object as above

#### `GET /api/local/inventory/:uuid`
Get a player's complete inventory including items, enchantments, and custom names.

**Response:**
```json
{
  "success": true,
  "uuid": "12345678-1234-1234-1234-123456789abc",
  "totalItems": 23,
  "inventory": [
    {
      "slot": 0,
      "id": "minecraft:diamond_sword",
      "name": "GG EZ",
      "customName": "GG EZ",
      "count": 1,
      "enchantments": [
        { "id": "minecraft:sharpness", "level": 5 },
        { "id": "minecraft:unbreaking", "level": 3 }
      ]
    }
  ]
}
```

#### `GET /api/local/stats-with-inventory`
Get all players with both their statistics AND inventory data combined.

**Response:**
```json
{
  "success": true,
  "playerCount": 2,
  "players": [
    {
      "uuid": "...",
      "name": "PlayerName",
      "skin": "...",
      "stats": { /* player stats */ },
      "inventory": [ /* inventory items */ ],
      "inventoryCount": 23
    }
  ]
}
```

### Upload Endpoints

#### `POST /api/upload`
Upload and process stats files (temporary - files deleted after processing).

**Content-Type:** `multipart/form-data`

**Body:**
- `stats`: Array of JSON files (field name for multer)

**Response:**
```json
{
  "success": true,
  "playerCount": 3,
  "players": [
    {
      "uuid": "12345678-1234-1234-1234-123456789abc",
      "name": "PlayerName",
      "skin": "https://textures.minecraft.net/texture/...",
      "cape": null,
      "stats": {
        "playtime": 1234,
        "deaths": 10,
        "mobKills": 500,
        "playerKills": 5,
        "blocksMined": 5000,
        "jumps": 1000,
        "distanceWalked": 50000,
        "distanceSprinted": 20000,
        "distanceFlown": 1000,
        "damageTaken": 500,
        "damageDealt": 1000,
        "itemsEnchanted": 10,
        "animalsBreed": 20,
        "fishCaught": 15
      },
      "dataVersion": 3465,
      "rawStats": { /* full stats object */ }
    }
  ]
}
```

### `POST /api/process-directory`
Process stats from a local directory (useful for development).

**Body:**
```json
{
  "directoryPath": "C:/path/to/minecraft/world/stats"
}
```

#### `POST /api/upload`
Upload and process stats files (temporary - files deleted after processing).

**Content-Type:** `multipart/form-data`

**Body:**
- `stats`: Array of JSON files (field name for multer)

**Response:** Same as `GET /api/stats/all`

#### `POST /api/process-directory`
Process stats from any local directory path (useful for development).

**Body:**
```json
{
  "directoryPath": "C:/path/to/minecraft/world/stats"
}
```

**Response:** Same as `GET /api/stats/all`

### Mojang Profile Lookup

#### `GET /api/player/:uuid`
Get player profile from Mojang API (name, skin, cape) - no stats.

**Response:**
```json
{
  "uuid": "12345678-1234-1234-1234-123456789abc",
  "name": "PlayerName",
  "skin": "https://textures.minecraft.net/texture/...",
  "cape": null
}
```

### Cache Management

#### `POST /api/cache/clear`
Clear the player profile cache.

#### `GET /api/cache/stats`
Get cache statistics.

**Response:**
```json
{
  "size": 5,
  "players": ["uuid1", "uuid2", ...]
}
```

## Installation

```powershell
# Install dependencies
npm install

# Start server
npm start

# Development mode with auto-reload
npm run dev
```

## Environment Variables

Create a `.env` file (optional):

```env
PORT=3000
"# Absolute or relative (to this repo) path to your world stats folder"
STATS_DIR=C:\\path\\to\\minecraft\\world\\stats
```

## Usage with Vue Frontend

### 1. Basic File Upload

```javascript
async function uploadStats(files) {
  const formData = new FormData();
  
  for (const file of files) {
    formData.append('stats', file);
  }
  
  const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return data.players;
}
```

### 2. Process Local Directory

```javascript
async function processDirectory(path) {
  const response = await fetch('http://localhost:3000/api/process-directory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ directoryPath: path })
  });
  
  const data = await response.json();
  return data.players;
}
```

## Statistics Included

The API extracts and formats the following statistics:

- **playtime** - Total time played in minutes
- **deaths** - Total deaths
- **mobKills** - Mobs killed
- **playerKills** - Players killed
- **blocksMined** - Total blocks mined
- **jumps** - Times jumped
- **distanceWalked** - Distance walked in blocks
- **distanceSprinted** - Distance sprinted in blocks
- **distanceFlown** - Distance flown in blocks
- **damageTaken** - Total damage taken
- **damageDealt** - Total damage dealt
- **itemsEnchanted** - Items enchanted
- **animalsBreed** - Animals bred
- **fishCaught** - Fish caught

Plus full `rawStats` object with all Minecraft statistics.

## Player Profiles

The API fetches player names and skins from the Mojang Session API:
- Player username
- Skin texture URL
- Cape texture URL (if available)
- Results are cached for 1 hour to reduce API calls

## Error Handling

- Invalid files are skipped
- Failed Mojang API requests fall back to shortened UUID
- Detailed error logging to console

## Dependencies

- **express** - Web server framework
- **cors** - Enable CORS
- **multer** - File upload handling
- **axios** - HTTP requests to Mojang API
- **dotenv** - Environment variables (STATS_DIR)
- **prismarine-nbt** - NBT file parsing for inventory data

## Development

```powershell
# Optional: nodemon is already configured for dev
npm run dev
```

## Security Notes

- File uploads are limited to JSON files
- Uploaded files are deleted after processing
- Consider adding rate limiting for production
- Add authentication for production use

## Local Stats Mode

If you prefer to keep your stats files locally and have the API read them on demand:

1) Set the path to your stats in `.env` using `STATS_DIR` (examples below). If not set, the default is `<repo>/uploads/worlds/MyWorld/stats`.
2) Place or point to your Minecraft world's `stats` folder. Each file should be named `UUID.json`.
3) Hit `GET /api/stats/all` to get all players, or `GET /api/stats/player/:uuid` for one player.

Examples (PowerShell):

```powershell
# Configure STATS_DIR to your world stats folder
"STATS_DIR=C:\\Users\\ASUS\\AppData\\Roaming\\.minecraft\\saves\\MyWorld\\stats" | Out-File -FilePath .env -Append -Encoding ascii

# Check config
Invoke-RestMethod http://localhost:3000/api/config

# List local files
Invoke-RestMethod http://localhost:3000/api/stats/files

# Get all stats
Invoke-RestMethod http://localhost:3000/api/stats/all

# Get single player's stats
Invoke-RestMethod http://localhost:3000/api/stats/player/12345678-1234-1234-1234-123456789abc

# Get player inventory
Invoke-RestMethod http://localhost:3000/api/inventory/player/12345678-1234-1234-1234-123456789abc

# Get all players with stats and inventory
Invoke-RestMethod http://localhost:3000/api/inventory/all-with-stats
```

## License

MIT