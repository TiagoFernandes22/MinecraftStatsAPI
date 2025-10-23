# Minecraft Stats API

A production-ready Node.js/Express API server that processes Minecraft server stats files and provides comprehensive player information including names, skins, statistics, and inventory data.

## Features

- **File Upload** - Accept stats JSON files and world zips via multipart/form-data
- **Player Profiles** - Fetch player names and skins from Mojang API
- **Stats Processing** - Parse and format all Minecraft statistics
- **Inventory Parsing** - Read player inventories with enchantments from NBT data
- **Player Filtering** - Hide/show specific players in your world
- **Caching** - Cache player profiles to reduce API calls
- **CORS Enabled** - Works with any frontend
- **API Key Authentication** - Secure endpoints with Bearer token authentication
- **Multi-User Support** - Each user gets isolated world storage
- **Security Hardening** - Helmet, rate limiting, request logging, file size limits
- **World Uploads** - Accept and extract full Minecraft world zip files
- **Storage Quotas** - Per-user storage limits (500MB, 10k files default)
- **Overwrite Protection** - Prevent accidental world replacements

## Table of Contents

- [Authentication & Security](#authentication--security)
- [API Endpoints](#api-endpoints)
- [System & Configuration](#system--configuration)
- [Player Stats](#player-stats)
- [Player Management](#player-management)
- [Upload Operations](#upload-operations)
- [World Management](#world-management)
- [Cache Management](#cache-management)
- [Admin Operations](#admin-operations)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)

## Authentication & Security

### API Keys

All endpoints (except `/api/health`) require authentication via the `Authorization` header:

```http
Authorization: Bearer your-api-key-here
```

### Demo User

The server ships with a demo user for testing:

```json
{
  "userId": "demo-user",
  "apiKey": "demo-key-123456",
  "displayName": "Demo User"
}
```

### Security Features

- **API Key Authentication** - Bearer token-based auth
- **Rate Limiting** - 120 requests/minute per IP
- **Helmet Security Headers** - XSS protection, CSP, etc.
- **Request Logging** - Morgan combined format
- **File Size Limits** - 5MB for JSON, 100MB for zips
- **Per-User Quotas** - 500MB storage, 10k files max
- **Isolated Storage** - Users can only access their own data
- **Input Validation** - Validates all user inputs

### Storage Quotas

Per-user limits:
- **Storage:** 500 MB
- **Files:** 10,000 maximum
- Returns `413 Payload Too Large` when exceeded

---

## API Endpoints

### System & Configuration

#### `GET /api/health`

Health check endpoint. **No authentication required.**

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T12:00:00.000Z"
}
```

---

#### `GET /api/me`

Get current authenticated user information.

**Headers:**
```http
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "userId": "demo-user",
  "displayName": "Demo User"
}
```

---

#### 🔒 `GET /api/config`

Get API configuration and user's world directory status.

**Headers:**
```http
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "port": 3000,
  "userId": "demo-user",
  "displayName": "Demo User",
  "statsDir": "C:/path/to/uploads/worlds/demo-user/stats",
  "statsDirExists": true,
  "statsFileCount": 4,
  "playerdataDir": "C:/path/to/uploads/worlds/demo-user/playerdata",
  "playerdataDirExists": true,
  "worldDir": "C:/path/to/uploads/worlds/demo-user"
}
```

---

### Player Stats

#### 🔒 `GET /api/local/files`

List all stats files in your world with metadata.

**Headers:**
```http
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "success": true,
  "count": 4,
  "files": [
    {
      "filename": "550e8400-e29b-41d4-a716-446655440000.json",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "size": 12345,
      "modified": "2025-10-23T12:00:00.000Z"
    }
  ]
}
```

---

#### 🔒 `GET /api/local/stats`

Get all players with parsed statistics.

**Headers:**
```http
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "success": true,
  "playerCount": 3,
  "players": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
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
      "rawStats": {}
    }
  ]
}
```

---

#### 🔒 `GET /api/local/player/:uuid`

Get a single player's statistics by UUID.

**Headers:**
```http
Authorization: Bearer your-api-key
```

**URL Parameters:**
- `uuid` - Player UUID (with or without dashes)

**Response:** Same as single player object above

---

#### 🔒 `GET /api/local/inventory/:uuid`

Get a player's complete inventory with items and enchantments.

**Headers:**
```http
Authorization: Bearer your-api-key
```

**URL Parameters:**
- `uuid` - Player UUID (with or without dashes)

**Response:**
```json
{
  "success": true,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "totalItems": 5,
  "inventory": [
    {
      "slot": 0,
      "id": "diamond_sword",
      "name": "Legendary Blade",
      "customName": "Legendary Blade",
      "count": 1,
      "enchantments": [
        { "id": "sharpness", "level": 5 },
        { "id": "unbreaking", "level": 3 }
      ]
    },
    {
      "slot": -106,
      "id": "shield",
      "name": "Defender",
      "customName": "Defender",
      "count": 1,
      "enchantments": []
    }
  ]
}
```

**Notes:**
- Slot -106 = Offhand
- Slots 0-8 = Hotbar
- Slots 9-35 = Main inventory
- Slots 100-103 = Armor
- Returns 404 if player file not found

---

#### 🔒 `GET /api/local/stats-with-inventory`

Get all players with stats AND inventory combined. **Respects player filter.**

**Headers:**
```http
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "success": true,
  "playerCount": 2,
  "players": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "PlayerName",
      "skin": "https://textures.minecraft.net/texture/...",
      "stats": {},
      "inventory": [],
      "inventoryCount": 5
    }
  ]
}
```

**Notes:**
- Hidden players (from filter) are excluded
- Use `/api/players/all` to get unfiltered list

---

#### 🔒 `GET /api/player/:uuid`

Get player profile from Mojang API (name, skin, cape). Only works for players in your world.

**Headers:**
```http
Authorization: Bearer your-api-key
```

**URL Parameters:**
- `uuid` - Player UUID

**Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "name": "PlayerName",
  "skin": "https://textures.minecraft.net/texture/abc123...",
  "cape": null
}
```

**Error (Player not in world):**
```json
{
  "error": "Player not found in your world",
  "hint": "This player does not exist in your uploaded world data"
}
```

---

### Player Management

#### 🔒 `GET /api/players/all`

Get ALL players (unfiltered) for player management UI.

**Headers:**
```http
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "success": true,
  "playerCount": 3,
  "players": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Player1",
      "stats": {},
      "inventory": [],
      "inventoryCount": 5
    }
  ]
}
```

**Notes:**
- Returns ALL players regardless of filter
- Use this for building player management UI
- Players can be hidden/shown via filter endpoint

---

#### 🔒 `GET /api/players/filter`

Get current player filter settings (list of hidden players).

**Headers:**
```http
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "hiddenPlayers": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ],
  "updatedAt": "2025-10-23T12:00:00.000Z"
}
```

**Notes:**
- Returns empty array if no filter exists
- Hidden players are excluded from `/api/local/stats-with-inventory`

---

#### 🔒 `POST /api/players/filter`

Update player filter settings (hide/show players).

**Headers:**
```http
Authorization: Bearer your-api-key
Content-Type: application/json
```

**Body:**
```json
{
  "hiddenPlayers": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Player filter updated",
  "hiddenCount": 2
}
```

**Notes:**
- `hiddenPlayers` must be an array of UUIDs
- Pass empty array `[]` to show all players
- Filter is saved to `player-filter.json` in your world folder

**Example - Hide 2 players:**
```json
{ "hiddenPlayers": ["uuid1", "uuid2"] }
```

**Example - Show all players:**
```json
{ "hiddenPlayers": [] }
```

---

### Upload Operations

#### 🔒 `POST /api/upload`

Upload and process stats JSON files.

**Headers:**
```http
Authorization: Bearer your-api-key
Content-Type: multipart/form-data
```

**Body:**
- `stats` - One or more JSON files (multipart field name)

**Response:**
```json
{
  "success": true,
  "playerCount": 3,
  "players": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "PlayerName",
      "stats": {},
      "dataVersion": 3465
    }
  ]
}
```

---

#### 🔒 `POST /api/upload/world`

Upload and extract a Minecraft world zip file. **One world per user.**

**Headers:**
```http
Authorization: Bearer your-api-key
Content-Type: multipart/form-data
```

**Body:**
- `world` - ZIP file containing your Minecraft world

**Response:**
```json
{
  "success": true,
  "userId": "demo-user",
  "worldPath": "C:/path/to/uploads/worlds/demo-user",
  "extractedFiles": 1234,
  "message": "World uploaded and extracted successfully"
}
```

**Requirements:**
- Must contain `stats/` or `playerdata/` folder
- Maximum file size: 100 MB
- Must delete existing world first (see DELETE /api/world)

**Error - World Already Exists (409):**
```json
{
  "error": "World already exists",
  "message": "You already have a world uploaded. Delete it first using DELETE /api/world before uploading a new one.",
  "hint": "Use DELETE /api/world to remove your existing world data"
}
```

---

### World Management

#### 🔒 `DELETE /api/world`

Delete your entire world data. **Requires explicit confirmation.**

**Headers:**
```http
Authorization: Bearer your-api-key
```

**Confirmation (choose one):**

Option 1 - Query Parameter:
```http
DELETE /api/world?confirm=true
```

Option 2 - Request Body:
```json
{
  "confirm": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "World deleted successfully",
  "userId": "demo-user"
}
```

**Error - Missing Confirmation (400):**
```json
{
  "error": "Confirmation required",
  "message": "To delete your world, you must explicitly confirm this action.",
  "hint": "Add ?confirm=true to the URL or include { \"confirm\": true } in the request body",
  "example": "DELETE /api/world?confirm=true"
}
```

**Notes:**
- Permanently deletes ALL data in `uploads/worlds/<userId>/`
- Cannot be undone
- Required before uploading a new world

---

### Cache Management

#### 🔒 `POST /api/cache/clear`

Clear the Mojang player profile cache.

**Headers:**
```http
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared"
}
```

---

#### 🔒 `GET /api/cache/stats`

Get cache statistics.

**Headers:**
```http
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "size": 5,
  "players": ["uuid1", "uuid2", "uuid3"]
}
```

---

### Admin Operations

#### 🔒 `POST /admin/users`

Create a new user and generate a secure API key. **Requires ADMIN_KEY.**

**Headers:**
```http
Authorization: Bearer your-admin-key
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "new-user",
  "displayName": "New User Display Name"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "new-user",
  "apiKey": "a2e52e1f88c1b4e3c513f5662e9101b627f262a0f53bc7d89b2bba2e7da622da",
  "displayName": "New User Display Name",
  "message": "User created successfully. Save the API key securely."
}
```

**Notes:**
- Requires `ADMIN_KEY` environment variable
- API key is 64-character secure random hex string
- User data saved to `data/users.json`
- **API key is only shown once** - save it immediately!

---

## 🚀 Installation

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode with auto-reload
npm run dev
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server Port
PORT=3000

# Admin Key (for creating users)
ADMIN_KEY=your-secure-admin-key-change-me

# Optional: Direct API keys (comma-separated)
# Overrides users.json if set
API_KEYS=

# Optional: Custom paths (defaults to uploads/worlds/<userId>)
# STATS_DIR=C:\\path\\to\\minecraft\\world\\stats
# PLAYERDATA_DIR=C:\\path\\to\\minecraft\\world\\playerdata
```

---

## 🎯 Quick Start

### 1. Start the Server

```bash
npm start
```

Server will start on `http://localhost:3000`

### 2. Test with Demo User

```bash
# Check health
curl http://localhost:3000/api/health

# Get user info
curl http://localhost:3000/api/me \
  -H "Authorization: Bearer demo-key-123456"
```

### 3. Upload a World

```bash
# Upload world zip
curl -X POST http://localhost:3000/api/upload/world \
  -H "Authorization: Bearer demo-key-123456" \
  -F "world=@/path/to/world.zip"
```

### 4. Get Player Stats

```bash
# Get all players
curl http://localhost:3000/api/local/stats-with-inventory \
  -H "Authorization: Bearer demo-key-123456"
```

---

## 💡 Usage Examples

### JavaScript/Fetch

```javascript
const apiKey = 'demo-key-123456';
const headers = { Authorization: `Bearer ${apiKey}` };

// 1. Check authentication
const user = await fetch('http://localhost:3000/api/me', { headers })
  .then(r => r.json());
console.log('Logged in as:', user.displayName);

// 2. Upload world
const formData = new FormData();
formData.append('world', worldZipFile);
const upload = await fetch('http://localhost:3000/api/upload/world', {
  method: 'POST',
  headers,
  body: formData
}).then(r => r.json());

// 3. Get all players
const stats = await fetch('http://localhost:3000/api/local/stats-with-inventory', { headers })
  .then(r => r.json());
console.log('Players:', stats.players);

// 4. Hide a player
await fetch('http://localhost:3000/api/players/filter', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ hiddenPlayers: ['uuid1', 'uuid2'] })
});

// 5. Delete world
await fetch('http://localhost:3000/api/world?confirm=true', {
  method: 'DELETE',
  headers
});
```

### PowerShell

```powershell
$apiKey = "demo-key-123456"
$headers = @{ Authorization = "Bearer $apiKey" }

# Get user info
Invoke-RestMethod -Uri "http://localhost:3000/api/me" -Headers $headers

# Get all players
$players = Invoke-RestMethod -Uri "http://localhost:3000/api/local/stats-with-inventory" -Headers $headers
$players.players | Format-Table name, playtime, deaths

# Hide players
$filterHeaders = @{ 
  Authorization = "Bearer $apiKey"
  "Content-Type" = "application/json"
}
$body = @{ hiddenPlayers = @("uuid1", "uuid2") } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/players/filter" -Method Post -Headers $filterHeaders -Body $body

# Delete world
Invoke-RestMethod -Uri "http://localhost:3000/api/world?confirm=true" -Method Delete -Headers $headers
```

---

## 📊 Statistics Included

The API extracts and formats these statistics:

| Stat | Description | Unit |
|------|-------------|------|
| `playtime` | Total time played | minutes |
| `deaths` | Total deaths | count |
| `mobKills` | Mobs killed | count |
| `playerKills` | Players killed | count |
| `blocksMined` | Total blocks mined | count |
| `jumps` | Times jumped | count |
| `distanceWalked` | Distance walked | blocks |
| `distanceSprinted` | Distance sprinted | blocks |
| `distanceFlown` | Distance flown | blocks |
| `damageTaken` | Total damage taken | points |
| `damageDealt` | Total damage dealt | points |
| `itemsEnchanted` | Items enchanted | count |
| `animalsBreed` | Animals bred | count |
| `fishCaught` | Fish caught | count |

Plus `rawStats` object with ALL Minecraft statistics.

---

## 🏗️ Architecture

### Per-User Isolation

Each user gets isolated storage:

```
uploads/worlds/
├── demo-user/
│   ├── stats/
│   │   ├── player1.json
│   │   └── player2.json
│   ├── playerdata/
│   │   ├── player1.dat
│   │   └── player2.dat
│   └── player-filter.json
├── hermit/
│   ├── stats/
│   └── playerdata/
└── snacks/
    ├── stats/
    └── playerdata/
```

**How it works:**
1. User authenticates with API key
2. Server maps API key → userId (from `data/users.json`)
3. All operations use `uploads/worlds/<userId>/`
4. Users cannot access other users' data

### Storage Quotas

Per-user limits enforced:
- **500 MB** total storage
- **10,000** max files
- Returns `413 Payload Too Large` when exceeded

---

## 📦 Dependencies

- **express** v5.1.0 - Web server framework
- **cors** v2.8.5 - CORS support
- **multer** v2.0.2 - File upload handling
- **axios** v1.12.2 - HTTP requests to Mojang API
- **prismarine-nbt** v2.5.0 - NBT file parsing for inventory
- **helmet** v7.0.0 - Security headers
- **express-rate-limit** v7.0.0 - Rate limiting
- **morgan** v1.10.0 - Request logging
- **adm-zip** - World zip extraction
- **dotenv** - Environment variables

---

## 🛡️ Security Best Practices

### For Production

- ✅ Use HTTPS (terminate TLS at reverse proxy)
- ✅ Store `data/users.json` with proper file permissions (chmod 600)
- ✅ Set strong `ADMIN_KEY` and rotate regularly
- ✅ Enable monitoring and error tracking (Sentry, Datadog)
- ✅ Set up backups for `uploads/` and `data/`
- ✅ Consider migrating to database (SQLite/Postgres)
- ✅ Move uploads to S3 or persistent storage
- ✅ Add tests and CI/CD pipeline
- ✅ Implement user registration with email verification
- ✅ Add 2FA for admin operations

---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

## 📮 Support

For issues and questions, please open an issue on GitHub.

## Authentication & Security

### API Keys
Protected endpoints require an API key passed via the `Authorization` header:
```
Authorization: Bearer your-api-key-here
```

**Demo API Key** (from `data/users.json`):
```
demo-key-123456
```

### Protected Endpoints
All endpoints except `/api/health` require authentication:
- `GET /api/me` - Current user info
- `GET /api/config` - API configuration
- `GET /api/local/files` - List stats files
- `GET /api/local/stats` - Get all player stats
- `GET /api/local/player/:uuid` - Get single player stats
- `GET /api/local/inventory/:uuid` - Get player inventory
- `GET /api/local/stats-with-inventory` - Stats + inventory
- `GET /api/player/:uuid` - Mojang profile lookup
- `POST /api/upload` - Stats file upload
- `POST /api/upload/world` - World zip upload
- `DELETE /api/world` - Delete your world data
- `POST /api/process-directory` - Directory processing
- `POST /api/cache/clear` - Clear cache
- `GET /api/cache/stats` - Cache statistics
- `POST /admin/users` - User creation (requires `ADMIN_KEY` env var)

### Rate Limiting
- Default: 120 requests per minute per IP
- Configurable via express-rate-limit settings

### Storage Quotas
- Per-user storage: 500 MB default
- Max files: 10,000 per user
- Returns `413 Payload Too Large` when exceeded

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

#### `GET /api/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "userId": "demo-user",
  "displayName": "Demo User"
}
```

#### `GET /api/config`
Show API configuration including your user's directories.

**Authentication:** Required (API key)

**Headers:**
```
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "port": 3000,
  "userId": "demo-user",
  "displayName": "Demo User",
  "statsDir": "C:/path/to/uploads/worlds/demo-user/stats",
  "statsDirExists": true,
  "statsFileCount": 4,
  "playerdataDir": "C:/path/to/uploads/worlds/demo-user/playerdata",
  "playerdataDirExists": true,
  "worldDir": "C:/path/to/uploads/worlds/demo-user"
}
```

### Player Stats Endpoints

#### `GET /api/local/files`
List all JSON stats files found in your user's stats directory with metadata.

**Authentication:** Required (API key)

**Headers:**
```
Authorization: Bearer your-api-key
```

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
Get all players with their parsed statistics from your user's stats directory.

**Authentication:** Required (API key)

**Headers:**
```
Authorization: Bearer your-api-key
```

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
Get a single player's statistics by UUID from your user's stats directory.

**Authentication:** Required (API key)

**Headers:**
```
Authorization: Bearer your-api-key
```

**Response:** Same player object as above

#### `GET /api/local/inventory/:uuid`
Get a player's complete inventory including items, enchantments, and custom names from your user's playerdata directory.

**Authentication:** Required (API key)

**Headers:**
```
Authorization: Bearer your-api-key
```

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
Get all players with both their statistics AND inventory data combined from your user's directories.

**Authentication:** Required (API key)

**Headers:**
```
Authorization: Bearer your-api-key
```

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
Upload and process stats files. Files are stored in per-user isolated storage.

**Authentication:** Required (API key)

**Content-Type:** `multipart/form-data`

**Headers:**
```
Authorization: Bearer your-api-key
```

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
      "stats": { /* key stats */ },
      "dataVersion": 3465,
      "rawStats": { /* full stats object */ }
    }
  ]
}
```

**Notes:**
- Files are saved to `uploads/worlds/<userId>/stats/` before processing
- Files are deleted after processing
- Subject to per-user storage quotas (500MB default)

#### `POST /api/upload/world`
Upload and extract a complete Minecraft world zip file.

**Authentication:** Required (API key)

**Content-Type:** `multipart/form-data`

**Headers:**
```
Authorization: Bearer your-api-key
```

**Body:**
- `world`: A single ZIP file containing your Minecraft world

**Response:**
```json
{
  "success": true,
  "userId": "demo-user",
  "worldPath": "/path/to/uploads/worlds/demo-user",
  "extractedFiles": 1234,
  "message": "World uploaded and extracted successfully"
}
```

**Notes:**
- World must contain `stats/` or `playerdata/` folders
- Extracts to `uploads/worlds/<userId>/`
- Maximum file size: 100 MB
- Subject to per-user storage quotas
- **One world per user**: If you already have a world uploaded, you must delete it first using `DELETE /api/world`
- Returns `409 Conflict` if a world already exists

**Error Response (World Already Exists):**
```json
{
  "error": "World already exists",
  "message": "You already have a world uploaded. Delete it first using DELETE /api/world before uploading a new one.",
  "hint": "Use DELETE /api/world to remove your existing world data"
}
```

#### `POST /api/process-directory`
Process stats from any local directory path (useful for development).

**Authentication:** Required (API key)

**Body:**
```json
{
  "directoryPath": "C:/path/to/minecraft/world/stats"
}
```

**Response:** Same as `POST /api/upload`

### Mojang Profile Lookup

#### `GET /api/player/:uuid`
Get player profile from Mojang API (name, skin, cape) - no stats.

**Authentication:** Required (API key)

**Headers:**
```
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "uuid": "12345678-1234-1234-1234-123456789abc",
  "name": "PlayerName",
  "skin": "https://textures.minecraft.net/texture/...",
  "cape": null
}
```

### World Management

#### `DELETE /api/world`
Delete your entire world data. This removes all stats, playerdata, and world files. Use this before uploading a new world.

**Authentication:** Required (API key)

**Headers:**
```
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "success": true,
  "message": "World deleted successfully",
  "userId": "demo-user"
}
```

**Notes:**
- Permanently deletes all data in `uploads/worlds/<userId>/`
- Cannot be undone
- Returns 404 if no world exists
- Use this before uploading a new world if one already exists

### Cache Management

#### `POST /api/cache/clear`
Clear the player profile cache.

**Authentication:** Required (API key)

**Headers:**
```
Authorization: Bearer your-api-key
```

#### `GET /api/cache/stats`
Get cache statistics.

**Authentication:** Required (API key)

**Headers:**
```
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "size": 5,
  "players": ["uuid1", "uuid2", ...]
}
```

### Admin Endpoints

#### `POST /admin/users`
Create a new user and generate an API key. Protected by `ADMIN_KEY` environment variable.

**Authentication:** Required (Admin key)

**Headers:**
```
Authorization: Bearer your-admin-key
```

**Body:**
```json
{
  "userId": "new-user",
  "displayName": "New User Display Name"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "new-user",
  "apiKey": "generated-secure-key-here",
  "displayName": "New User Display Name",
  "message": "User created successfully. Save the API key securely."
}
```

**Notes:**
- Requires `ADMIN_KEY` environment variable to be set
- Generated API key is a 64-character hex string (secure random)
- User data is saved to `data/users.json`
- API key is only shown once - save it securely

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

Create a `.env` file:

```env
PORT=3000
# Optional: Comma-separated API keys for simple deployments
API_KEYS=key1,key2,key3
# Admin key for creating users via /admin/users endpoint
ADMIN_KEY=your-secure-admin-key
# Optional: Path to your world stats folder (defaults to uploads/worlds/MyWorld/stats)
STATS_DIR=C:\\path\\to\\minecraft\\world\\stats
```

## Quick Start with Authentication

### 1. Use the Demo API Key

The server ships with a demo user in `data/users.json`:
```json
{
  "userId": "demo-user",
  "apiKey": "demo-key-123456",
  "displayName": "Demo User"
}
```

Test it:
```powershell
# Check authentication
Invoke-RestMethod -Uri "http://localhost:3000/api/me" -Headers @{ Authorization = "Bearer demo-key-123456" }

# Upload stats
$headers = @{ Authorization = "Bearer demo-key-123456" }
# (add your multipart form data upload here)
```

### 2. Create New Users (Admin)

Set `ADMIN_KEY` in `.env`, then:
```powershell
$headers = @{
  "Authorization" = "Bearer your-admin-key"
  "Content-Type" = "application/json"
}
$body = @{
  userId = "alice"
  displayName = "Alice"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/admin/users" -Method Post -Headers $headers -Body $body
```

Save the returned API key securely!

## Usage Examples

### 1. Upload Stats with Authentication

```javascript
async function uploadStats(files, apiKey) {
  const formData = new FormData();
  
  for (const file of files) {
    formData.append('stats', file);
  }
  
  const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });
  
  const data = await response.json();
  return data.players;
}
```

### 2. Upload World Zip

```javascript
async function uploadWorld(zipFile, apiKey) {
  const formData = new FormData();
  formData.append('world', zipFile);
  
  const response = await fetch('http://localhost:3000/api/upload/world', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });
  
  return await response.json();
}
```

### 3. Delete World (before uploading a new one)

```javascript
async function deleteWorld(apiKey) {
  const response = await fetch('http://localhost:3000/api/world', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  return await response.json();
}

// Usage: Delete old world before uploading a new one
await deleteWorld(apiKey);
await uploadWorld(newZipFile, apiKey);
```

### 4. Check Current User

```javascript
async function getCurrentUser(apiKey) {
  const response = await fetch('http://localhost:3000/api/me', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  return await response.json();
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

## Per-User World Isolation

Each authenticated user gets their own isolated world storage:

- **Storage Location:** `uploads/worlds/<userId>/`
- **Stats:** `uploads/worlds/<userId>/stats/`
- **Playerdata:** `uploads/worlds/<userId>/playerdata/`
- **World Files:** Region files, level.dat extracted to user folder

**How it Works:**
1. User authenticates with API key
2. Server maps API key → userId
3. All uploads/reads use that user's folder
4. Users cannot access other users' data

**Quotas:**
- Storage: 500 MB per user (configurable)
- Files: 10,000 max per user
- Uploads return `413` when quota exceeded

## Dependencies

- **express** - Web server framework
- **cors** - Enable CORS
- **multer** - File upload handling
- **axios** - HTTP requests to Mojang API
- **dotenv** - Environment variables
- **prismarine-nbt** - NBT file parsing for inventory data
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **morgan** - Request logging
- **express-validator** - Request validation
- **adm-zip** - World zip extraction

## Development

```powershell
# Optional: nodemon is already configured for dev
npm run dev
```

## Security Features

### Implemented
- ✅ API key authentication (Bearer tokens)
- ✅ Rate limiting (120 req/min per IP)
- ✅ Helmet security headers
- ✅ Request logging (morgan)
- ✅ File size limits (5MB stats, 100MB worlds)
- ✅ Per-user storage quotas
- ✅ Isolated user storage (no cross-user access)
- ✅ World zip validation (checks for region/ or level.dat)
- ✅ Filename sanitization

### Production Recommendations
- Use HTTPS (terminate TLS at reverse proxy or use certificates)
- Store `data/users.json` securely with proper file permissions
- Set strong `ADMIN_KEY` and rotate regularly
- Consider migrating to database (SQLite/Postgres) for user management
- Move uploads to S3 or persistent storage with backups
- Add monitoring and error tracking (Sentry)
- Implement user registration flow with email verification
- Add tests and CI/CD pipeline

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