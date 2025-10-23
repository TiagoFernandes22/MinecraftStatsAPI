# 🎮 Minecraft Stats API

A production-ready Node.js/Express API server that processes Minecraft server stats files and provides player information including names, skins, and formatted statistics data.

## Features

- 📤 **File Upload** - Accept stats JSON files and world zips via multipart/form-data
- 👤 **Player Profiles** - Fetch player names and skins from Mojang API
- 📊 **Stats Processing** - Parse and format all Minecraft statistics
- 💾 **Caching** - Cache player profiles to reduce API calls
- 🌐 **CORS Enabled** - Works with your Vue frontend
- 🔐 **API Key Authentication** - Secure endpoints with Bearer token authentication
- 👥 **Multi-User Support** - Each user gets isolated world storage
- 🛡️ **Security Hardening** - Helmet, rate limiting, request logging, file size limits
- 📦 **World Uploads** - Accept and extract full Minecraft world zip files
- 💿 **Storage Quotas** - Per-user storage limits (500MB default)

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
- `POST /api/upload` - Stats file upload
- `POST /api/upload/world` - World zip upload
- `POST /api/process-directory` - Directory processing
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
- World must contain `region/` folder or `level.dat` file
- Extracts to `uploads/worlds/<userId>/`
- Maximum file size: 100 MB
- Subject to per-user storage quotas

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

## Testing with Postman

### Setup Authentication

1. **Open Postman** and create a new request
2. **Set Authorization:**
   - Go to the **Authorization** tab
   - Type: Select **Bearer Token**
   - Token: Enter `demo-key-123456`

OR manually add header:
- Key: `Authorization`
- Value: `Bearer demo-key-123456`

### Test Endpoints

#### 1. Health Check (No Auth Required)
```
GET http://localhost:3000/api/health
```
- **Method:** GET
- **Auth:** None
- **Expected:** `{ "status": "ok", "timestamp": "..." }`

#### 2. Check Current User
```
GET http://localhost:3000/api/me
```
- **Method:** GET
- **Auth:** Bearer Token (use `demo-key-123456`)
- **Expected:** 
```json
{
  "userId": "demo-user",
  "displayName": "Demo User"
}
```

#### 3. Get Config
```
GET http://localhost:3000/api/config
```
- **Method:** GET
- **Auth:** None
- **Expected:** Server configuration with directory paths

#### 4. Upload Stats Files
```
POST http://localhost:3000/api/upload
```
- **Method:** POST
- **Auth:** Bearer Token (use `demo-key-123456`)
- **Body:** 
  - Type: **form-data**
  - Key: `stats` (change type to **File**)
  - Value: Select one or more `.json` stats files
- **Expected:** Parsed player stats with names and skins

**Note:** Stats files should be UUID.json format from Minecraft's stats folder

#### 5. Upload World Zip
```
POST http://localhost:3000/api/upload/world
```
- **Method:** POST
- **Auth:** Bearer Token (use `demo-key-123456`)
- **Body:**
  - Type: **form-data**
  - Key: `world` (change type to **File**)
  - Value: Select a `.zip` file containing your Minecraft world
- **Expected:**
```json
{
  "success": true,
  "userId": "demo-user",
  "worldPath": "...",
  "extractedFiles": 1234,
  "message": "World uploaded and extracted successfully"
}
```

**Note:** Zip must contain `region/` folder or `level.dat` file

#### 6. Create New User (Admin)
```
POST http://localhost:3000/admin/users
```
- **Method:** POST
- **Auth:** Bearer Token (use your `ADMIN_KEY` from .env)
- **Headers:**
  - Key: `Content-Type`
  - Value: `application/json`
- **Body:** (raw JSON)
```json
{
  "userId": "alice",
  "displayName": "Alice"
}
```
- **Expected:**
```json
{
  "success": true,
  "userId": "alice",
  "apiKey": "generated-key-here",
  "displayName": "Alice",
  "message": "User created successfully. Save the API key securely."
}
```

**Note:** Requires `ADMIN_KEY` environment variable to be set

#### 7. Get Local Stats
```
GET http://localhost:3000/api/local/stats
```
- **Method:** GET
- **Auth:** None (reads from configured STATS_DIR)
- **Expected:** All players from local stats directory with parsed data

#### 8. Get Player Inventory
```
GET http://localhost:3000/api/local/inventory/:uuid
```
- **Method:** GET
- **Auth:** None
- **URL:** Replace `:uuid` with actual player UUID
- **Example:** `http://localhost:3000/api/local/inventory/12345678-1234-1234-1234-123456789abc`
- **Expected:** Player's inventory with items and enchantments

#### 9. Clear Cache
```
POST http://localhost:3000/api/cache/clear
```
- **Method:** POST
- **Auth:** None
- **Expected:** `{ "success": true, "message": "Cache cleared" }`

### Common Errors

**401 Unauthorized:**
```json
{
  "error": "Unauthorized - missing or invalid API key"
}
```
- Solution: Check Authorization header is set correctly

**413 Payload Too Large:**
```json
{
  "error": "Storage quota exceeded",
  "currentSize": 524288000,
  "maxSize": 524288000
}
```
- Solution: User has reached storage quota (500MB default)

**400 Bad Request (World Upload):**
```json
{
  "error": "Invalid world zip: missing region/ folder or level.dat"
}
```
- Solution: Ensure zip contains valid Minecraft world structure

### Postman Collection (Import This)

Create a new collection and import these as JSON:

```json
{
  "info": {
    "name": "Minecraft Stats API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "demo-key-123456",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/health"
      }
    },
    {
      "name": "Get Current User",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/me",
        "auth": {
          "type": "inherit"
        }
      }
    },
    {
      "name": "Upload Stats",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/upload",
        "auth": {
          "type": "inherit"
        },
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "stats",
              "type": "file",
              "src": []
            }
          ]
        }
      }
    },
    {
      "name": "Upload World Zip",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/upload/world",
        "auth": {
          "type": "inherit"
        },
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "world",
              "type": "file",
              "src": []
            }
          ]
        }
      }
    }
  ]
}
```

Save this as `MinecraftStatsAPI.postman_collection.json` and import into Postman.

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

### 3. Check Current User

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