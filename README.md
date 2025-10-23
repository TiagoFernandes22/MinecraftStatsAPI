# Minecraft Stats API# Minecraft Stats API



A production-ready Node.js/Express API server that processes Minecraft server stats files and provides comprehensive player information including names, skins, statistics, and inventory data.A production-ready Node.js/Express API server that processes Minecraft server stats files and provides comprehensive player information including names, skins, statistics, and inventory data.



## Features## Features



- **File Upload** - Accept stats JSON files and world zips via multipart/form-data- **File Upload** - Accept stats JSON files and world zips via multipart/form-data

- **Player Profiles** - Fetch player names and skins from Mojang API- **Player Profiles** - Fetch player names and skins from Mojang API

- **Stats Processing** - Parse and format all Minecraft statistics- **Stats Processing** - Parse and format all Minecraft statistics

- **Inventory Parsing** - Read player inventories with enchantments from NBT data- **Inventory Parsing** - Read player inventories with enchantments from NBT data

- **Player Filtering** - Hide/show specific players in your world- **Player Filtering** - Hide/show specific players in your world

- **Caching** - Cache player profiles to reduce API calls- **Caching** - Cache player profiles to reduce API calls

- **CORS Enabled** - Works with any frontend- **CORS Enabled** - Works with any frontend

- **API Key Authentication** - Secure endpoints with Bearer token authentication- **API Key Authentication** - Secure endpoints with Bearer token authentication

- **Multi-User Support** - Each user gets isolated world storage- **Multi-User Support** - Each user gets isolated world storage

- **Security Hardening** - Helmet, rate limiting, request logging, file size limits- **Security Hardening** - Helmet, rate limiting, request logging, file size limits

- **World Uploads** - Accept and extract full Minecraft world zip files- **World Uploads** - Accept and extract full Minecraft world zip files

- **Storage Quotas** - Per-user storage limits (500MB, 10k files default)- **Storage Quotas** - Per-user storage limits (500MB, 10k files default)

- **Overwrite Protection** - Prevent accidental world replacements- **Overwrite Protection** - Prevent accidental world replacements



## Table of Contents## Table of Contents



- [Installation](#installation)- [Authentication & Security](#authentication--security)

- [Environment Variables](#environment-variables)- [API Endpoints](#api-endpoints)

- [Authentication](#authentication)- [System & Configuration](#system--configuration)

- [Quick Start](#quick-start)- [Player Stats](#player-stats)

- [API Endpoints](#api-endpoints)- [Player Management](#player-management)

  - [System & Configuration](#system--configuration)- [Upload Operations](#upload-operations)

  - [Player Stats](#player-stats)- [World Management](#world-management)

  - [Player Management](#player-management)- [Cache Management](#cache-management)

  - [Upload Operations](#upload-operations)- [Admin Operations](#admin-operations)

  - [World Management](#world-management)- [Installation](#installation)

  - [Cache Management](#cache-management)- [Quick Start](#quick-start)

  - [Admin Operations](#admin-operations)- [Usage Examples](#usage-examples)

- [Usage Examples](#usage-examples)

- [Statistics Reference](#statistics-reference)## Authentication & Security

- [Architecture](#architecture)

- [Security](#security)### API Keys



---All endpoints (except `/api/health`) require authentication via the `Authorization` header:



## Installation```http

Authorization: Bearer your-api-key-here

```bash```

# Install dependencies

npm install### Demo User



# Start serverThe server ships with a demo user for testing:

npm start

```json

# Development mode with auto-reload{

npm run dev  "userId": "demo-user",

```  "apiKey": "demo-key-123456",

  "displayName": "Demo User"

Server will start on `http://localhost:3000`}

```

---

### Security Features

## Environment Variables

- **API Key Authentication** - Bearer token-based auth

Create a `.env` file in the root directory:- **Rate Limiting** - 120 requests/minute per IP

- **Helmet Security Headers** - XSS protection, CSP, etc.

```env- **Request Logging** - Morgan combined format

# Server Port- **File Size Limits** - 5MB for JSON, 100MB for zips

PORT=3000- **Per-User Quotas** - 500MB storage, 10k files max

- **Isolated Storage** - Users can only access their own data

# Admin Key (for creating users)- **Input Validation** - Validates all user inputs

ADMIN_KEY=your-secure-admin-key-change-me

### Storage Quotas

# Optional: Direct API keys (comma-separated)

# Overrides users.json if setPer-user limits:

API_KEYS=- **Storage:** 500 MB

- **Files:** 10,000 maximum

# Optional: Custom paths (defaults to uploads/worlds/<userId>)- Returns `413 Payload Too Large` when exceeded

# STATS_DIR=C:\\path\\to\\minecraft\\world\\stats

# PLAYERDATA_DIR=C:\\path\\to\\minecraft\\world\\playerdata---

```

## API Endpoints

---

### System & Configuration

## Authentication

#### `GET /api/health`

### API Keys

Health check endpoint. **No authentication required.**

All endpoints (except `/api/health`) require authentication via the `Authorization` header:

**Response:**

```http```json

Authorization: Bearer your-api-key-here{

```  "status": "ok",

  "timestamp": "2025-10-23T12:00:00.000Z"

### Demo User}

```

The server ships with a demo user for testing (`data/users.demo.json`):

---

```json

{#### `GET /api/me`

  "userId": "demo-user",

  "apiKey": "demo-key-123456",Get current authenticated user information.

  "displayName": "Demo User"

}**Headers:**

``````http

Authorization: Bearer your-api-key

### Security Features```



- **API Key Authentication** - Bearer token-based auth**Response:**

- **Rate Limiting** - 120 requests/minute per IP```json

- **Helmet Security Headers** - XSS protection, CSP, etc.{

- **Request Logging** - Morgan combined format  "userId": "demo-user",

- **File Size Limits** - 5MB for JSON, 100MB for zips  "displayName": "Demo User"

- **Per-User Quotas** - 500MB storage, 10k files max}

- **Isolated Storage** - Users can only access their own data```

- **Input Validation** - Validates all user inputs

---

### Storage Quotas

#### 🔒 `GET /api/config`

Per-user limits:

- **Storage:** 500 MBGet API configuration and user's world directory status.

- **Files:** 10,000 maximum

- Returns `413 Payload Too Large` when exceeded**Headers:**

```http

---Authorization: Bearer your-api-key

```

## Quick Start

**Response:**

### 1. Start the Server```json

{

```bash  "port": 3000,

npm start  "userId": "demo-user",

```  "displayName": "Demo User",

  "statsDir": "C:/path/to/uploads/worlds/demo-user/stats",

### 2. Test with Demo User  "statsDirExists": true,

  "statsFileCount": 4,

```bash  "playerdataDir": "C:/path/to/uploads/worlds/demo-user/playerdata",

# Check health  "playerdataDirExists": true,

curl http://localhost:3000/api/health  "worldDir": "C:/path/to/uploads/worlds/demo-user"

}

# Get user info```

curl http://localhost:3000/api/me \

  -H "Authorization: Bearer demo-key-123456"---

```

### Player Stats

### 3. Upload a World

#### 🔒 `GET /api/local/files`

```bash

# Upload world zipList all stats files in your world with metadata.

curl -X POST http://localhost:3000/api/upload/world \

  -H "Authorization: Bearer demo-key-123456" \**Headers:**

  -F "world=@/path/to/world.zip"```http

```Authorization: Bearer your-api-key

```

### 4. Get Player Stats

**Response:**

```bash```json

# Get all players{

curl http://localhost:3000/api/local/stats-with-inventory \  "success": true,

  -H "Authorization: Bearer demo-key-123456"  "count": 4,

```  "files": [

    {

---      "filename": "550e8400-e29b-41d4-a716-446655440000.json",

      "uuid": "550e8400-e29b-41d4-a716-446655440000",

## API Endpoints      "size": 12345,

      "modified": "2025-10-23T12:00:00.000Z"

### System & Configuration    }

  ]

#### `GET /api/health`}

```

Health check endpoint. **No authentication required.**

---

**Response:**

```json#### 🔒 `GET /api/local/stats`

{

  "status": "ok",Get all players with parsed statistics.

  "timestamp": "2025-10-23T12:00:00.000Z"

}**Headers:**

``````http

Authorization: Bearer your-api-key

---```



#### `GET /api/me`**Response:**

```json

Get current authenticated user information.{

  "success": true,

**Authentication:** Required  "playerCount": 3,

  "players": [

**Headers:**    {

```http      "uuid": "550e8400-e29b-41d4-a716-446655440000",

Authorization: Bearer your-api-key      "name": "PlayerName",

```      "skin": "https://textures.minecraft.net/texture/...",

      "cape": null,

**Response:**      "stats": {

```json        "playtime": 1234,

{        "deaths": 10,

  "userId": "demo-user",        "mobKills": 500,

  "displayName": "Demo User"        "playerKills": 5,

}        "blocksMined": 5000,

```        "jumps": 1000,

        "distanceWalked": 50000,

---        "distanceSprinted": 20000,

        "distanceFlown": 1000,

#### `GET /api/config`        "damageTaken": 500,

        "damageDealt": 1000,

Get API configuration and user's world directory status.        "itemsEnchanted": 10,

        "animalsBreed": 20,

**Authentication:** Required        "fishCaught": 15

      },

**Headers:**      "dataVersion": 3465,

```http      "rawStats": {}

Authorization: Bearer your-api-key    }

```  ]

}

**Response:**```

```json

{---

  "port": 3000,

  "userId": "demo-user",#### 🔒 `GET /api/local/player/:uuid`

  "displayName": "Demo User",

  "statsDir": "C:/path/to/uploads/worlds/demo-user/stats",Get a single player's statistics by UUID.

  "statsDirExists": true,

  "statsFileCount": 4,**Headers:**

  "playerdataDir": "C:/path/to/uploads/worlds/demo-user/playerdata",```http

  "playerdataDirExists": true,Authorization: Bearer your-api-key

  "worldDir": "C:/path/to/uploads/worlds/demo-user"```

}

```**URL Parameters:**

- `uuid` - Player UUID (with or without dashes)

---

**Response:** Same as single player object above

### Player Stats

---

#### `GET /api/local/files`

#### 🔒 `GET /api/local/inventory/:uuid`

List all stats files in your world with metadata.

Get a player's complete inventory with items and enchantments.

**Authentication:** Required

**Headers:**

**Headers:**```http

```httpAuthorization: Bearer your-api-key

Authorization: Bearer your-api-key```

```

**URL Parameters:**

**Response:**- `uuid` - Player UUID (with or without dashes)

```json

{**Response:**

  "success": true,```json

  "count": 4,{

  "files": [  "success": true,

    {  "uuid": "550e8400-e29b-41d4-a716-446655440000",

      "filename": "550e8400-e29b-41d4-a716-446655440000.json",  "totalItems": 5,

      "uuid": "550e8400-e29b-41d4-a716-446655440000",  "inventory": [

      "size": 12345,    {

      "modified": "2025-10-23T12:00:00.000Z"      "slot": 0,

    }      "id": "diamond_sword",

  ]      "name": "Legendary Blade",

}      "customName": "Legendary Blade",

```      "count": 1,

      "enchantments": [

---        { "id": "sharpness", "level": 5 },

        { "id": "unbreaking", "level": 3 }

#### `GET /api/local/stats`      ]

    },

Get all players with parsed statistics.    {

      "slot": -106,

**Authentication:** Required      "id": "shield",

      "name": "Defender",

**Headers:**      "customName": "Defender",

```http      "count": 1,

Authorization: Bearer your-api-key      "enchantments": []

```    }

  ]

**Response:**}

```json```

{

  "success": true,**Notes:**

  "playerCount": 3,- Slot -106 = Offhand

  "players": [- Slots 0-8 = Hotbar

    {- Slots 9-35 = Main inventory

      "uuid": "550e8400-e29b-41d4-a716-446655440000",- Slots 100-103 = Armor

      "name": "PlayerName",- Returns 404 if player file not found

      "skin": "https://textures.minecraft.net/texture/...",

      "cape": null,---

      "stats": {

        "playtime": 1234,#### 🔒 `GET /api/local/stats-with-inventory`

        "deaths": 10,

        "mobKills": 500,Get all players with stats AND inventory combined. **Respects player filter.**

        "playerKills": 5,

        "blocksMined": 5000,**Headers:**

        "jumps": 1000,```http

        "distanceWalked": 50000,Authorization: Bearer your-api-key

        "distanceSprinted": 20000,```

        "distanceFlown": 1000,

        "damageTaken": 500,**Response:**

        "damageDealt": 1000,```json

        "itemsEnchanted": 10,{

        "animalsBreed": 20,  "success": true,

        "fishCaught": 15  "playerCount": 2,

      },  "players": [

      "dataVersion": 3465,    {

      "rawStats": {}      "uuid": "550e8400-e29b-41d4-a716-446655440000",

    }      "name": "PlayerName",

  ]      "skin": "https://textures.minecraft.net/texture/...",

}      "stats": {},

```      "inventory": [],

      "inventoryCount": 5

---    }

  ]

#### `GET /api/local/player/:uuid`}

```

Get a single player's statistics by UUID.

**Notes:**

**Authentication:** Required- Hidden players (from filter) are excluded

- Use `/api/players/all` to get unfiltered list

**Headers:**

```http---

Authorization: Bearer your-api-key

```#### 🔒 `GET /api/player/:uuid`



**URL Parameters:**Get player profile from Mojang API (name, skin, cape). Only works for players in your world.

- `uuid` - Player UUID (with or without dashes)

**Headers:**

**Response:** Same as single player object above```http

Authorization: Bearer your-api-key

---```



#### `GET /api/local/inventory/:uuid`**URL Parameters:**

- `uuid` - Player UUID

Get a player's complete inventory with items and enchantments.

**Response:**

**Authentication:** Required```json

{

**Headers:**  "uuid": "550e8400-e29b-41d4-a716-446655440000",

```http  "name": "PlayerName",

Authorization: Bearer your-api-key  "skin": "https://textures.minecraft.net/texture/abc123...",

```  "cape": null

}

**URL Parameters:**```

- `uuid` - Player UUID (with or without dashes)

**Error (Player not in world):**

**Response:**```json

```json{

{  "error": "Player not found in your world",

  "success": true,  "hint": "This player does not exist in your uploaded world data"

  "uuid": "550e8400-e29b-41d4-a716-446655440000",}

  "totalItems": 5,```

  "inventory": [

    {---

      "slot": 0,

      "id": "diamond_sword",### Player Management

      "name": "Legendary Blade",

      "customName": "Legendary Blade",#### 🔒 `GET /api/players/all`

      "count": 1,

      "enchantments": [Get ALL players (unfiltered) for player management UI.

        { "id": "sharpness", "level": 5 },

        { "id": "unbreaking", "level": 3 }**Headers:**

      ]```http

    },Authorization: Bearer your-api-key

    {```

      "slot": -106,

      "id": "shield",**Response:**

      "name": "Defender",```json

      "customName": "Defender",{

      "count": 1,  "success": true,

      "enchantments": []  "playerCount": 3,

    }  "players": [

  ]    {

}      "uuid": "550e8400-e29b-41d4-a716-446655440000",

```      "name": "Player1",

      "stats": {},

**Slot Reference:**      "inventory": [],

- Slot -106 = Offhand      "inventoryCount": 5

- Slots 0-8 = Hotbar    }

- Slots 9-35 = Main inventory  ]

- Slots 100-103 = Armor}

```

**Note:** Returns 404 if player file not found

**Notes:**

---- Returns ALL players regardless of filter

- Use this for building player management UI

#### `GET /api/local/stats-with-inventory`- Players can be hidden/shown via filter endpoint



Get all players with stats AND inventory combined. **Respects player filter.**---



**Authentication:** Required#### 🔒 `GET /api/players/filter`



**Headers:**Get current player filter settings (list of hidden players).

```http

Authorization: Bearer your-api-key**Headers:**

``````http

Authorization: Bearer your-api-key

**Response:**```

```json

{**Response:**

  "success": true,```json

  "playerCount": 2,{

  "players": [  "hiddenPlayers": [

    {    "550e8400-e29b-41d4-a716-446655440000",

      "uuid": "550e8400-e29b-41d4-a716-446655440000",    "660e8400-e29b-41d4-a716-446655440001"

      "name": "PlayerName",  ],

      "skin": "https://textures.minecraft.net/texture/...",  "updatedAt": "2025-10-23T12:00:00.000Z"

      "stats": {},}

      "inventory": [],```

      "inventoryCount": 5

    }**Notes:**

  ]- Returns empty array if no filter exists

}- Hidden players are excluded from `/api/local/stats-with-inventory`

```

---

**Note:** Hidden players (from filter) are excluded. Use `/api/players/all` to get unfiltered list.

#### 🔒 `POST /api/players/filter`

---

Update player filter settings (hide/show players).

#### `GET /api/player/:uuid`

**Headers:**

Get player profile from Mojang API (name, skin, cape). Only works for players in your world.```http

Authorization: Bearer your-api-key

**Authentication:** RequiredContent-Type: application/json

```

**Headers:**

```http**Body:**

Authorization: Bearer your-api-key```json

```{

  "hiddenPlayers": [

**URL Parameters:**    "550e8400-e29b-41d4-a716-446655440000",

- `uuid` - Player UUID    "660e8400-e29b-41d4-a716-446655440001"

  ]

**Response:**}

```json```

{

  "uuid": "550e8400-e29b-41d4-a716-446655440000",**Response:**

  "name": "PlayerName",```json

  "skin": "https://textures.minecraft.net/texture/abc123...",{

  "cape": null  "success": true,

}  "message": "Player filter updated",

```  "hiddenCount": 2

}

**Error Response (Player not in world):**```

```json

{**Notes:**

  "error": "Player not found in your world",- `hiddenPlayers` must be an array of UUIDs

  "hint": "This player does not exist in your uploaded world data"- Pass empty array `[]` to show all players

}- Filter is saved to `player-filter.json` in your world folder

```

**Example - Hide 2 players:**

---```json

{ "hiddenPlayers": ["uuid1", "uuid2"] }

### Player Management```



#### `GET /api/players/all`**Example - Show all players:**

```json

Get ALL players (unfiltered) for player management UI.{ "hiddenPlayers": [] }

```

**Authentication:** Required

---

**Headers:**

```http### Upload Operations

Authorization: Bearer your-api-key

```#### 🔒 `POST /api/upload`



**Response:**Upload and process stats JSON files.

```json

{**Headers:**

  "success": true,```http

  "playerCount": 3,Authorization: Bearer your-api-key

  "players": [Content-Type: multipart/form-data

    {```

      "uuid": "550e8400-e29b-41d4-a716-446655440000",

      "name": "Player1",**Body:**

      "stats": {},- `stats` - One or more JSON files (multipart field name)

      "inventory": [],

      "inventoryCount": 5**Response:**

    }```json

  ]{

}  "success": true,

```  "playerCount": 3,

  "players": [

**Note:** Returns ALL players regardless of filter. Use this for building player management UI where users can hide/show players.    {

      "uuid": "550e8400-e29b-41d4-a716-446655440000",

---      "name": "PlayerName",

      "stats": {},

#### `GET /api/players/filter`      "dataVersion": 3465

    }

Get current player filter settings (list of hidden players).  ]

}

**Authentication:** Required```



**Headers:**---

```http

Authorization: Bearer your-api-key#### 🔒 `POST /api/upload/world`

```

Upload and extract a Minecraft world zip file. **One world per user.**

**Response:**

```json**Headers:**

{```http

  "hiddenPlayers": [Authorization: Bearer your-api-key

    "550e8400-e29b-41d4-a716-446655440000",Content-Type: multipart/form-data

    "660e8400-e29b-41d4-a716-446655440001"```

  ],

  "updatedAt": "2025-10-23T12:00:00.000Z"**Body:**

}- `world` - ZIP file containing your Minecraft world

```

**Response:**

**Note:** Returns empty array if no filter exists. Hidden players are excluded from `/api/local/stats-with-inventory`.```json

{

---  "success": true,

  "userId": "demo-user",

#### `POST /api/players/filter`  "worldPath": "C:/path/to/uploads/worlds/demo-user",

  "extractedFiles": 1234,

Update player filter settings (hide/show players).  "message": "World uploaded and extracted successfully"

}

**Authentication:** Required```



**Headers:****Requirements:**

```http- Must contain `stats/` or `playerdata/` folder

Authorization: Bearer your-api-key- Maximum file size: 100 MB

Content-Type: application/json- Must delete existing world first (see DELETE /api/world)

```

**Error - World Already Exists (409):**

**Body:**```json

```json{

{  "error": "World already exists",

  "hiddenPlayers": [  "message": "You already have a world uploaded. Delete it first using DELETE /api/world before uploading a new one.",

    "550e8400-e29b-41d4-a716-446655440000",  "hint": "Use DELETE /api/world to remove your existing world data"

    "660e8400-e29b-41d4-a716-446655440001"}

  ]```

}

```---



**Response:**### World Management

```json

{#### 🔒 `DELETE /api/world`

  "success": true,

  "message": "Player filter updated",Delete your entire world data. **Requires explicit confirmation.**

  "hiddenCount": 2

}**Headers:**

``````http

Authorization: Bearer your-api-key

**Notes:**```

- `hiddenPlayers` must be an array of UUIDs

- Pass empty array `[]` to show all players**Confirmation (choose one):**

- Filter is saved to `player-filter.json` in your world folder

Option 1 - Query Parameter:

**Examples:**```http

DELETE /api/world?confirm=true

Hide 2 players:```

```json

{ "hiddenPlayers": ["uuid1", "uuid2"] }Option 2 - Request Body:

``````json

{

Show all players:  "confirm": true

```json}

{ "hiddenPlayers": [] }```

```

**Response:**

---```json

{

### Upload Operations  "success": true,

  "message": "World deleted successfully",

#### `POST /api/upload`  "userId": "demo-user"

}

Upload and process stats JSON files.```



**Authentication:** Required**Error - Missing Confirmation (400):**

```json

**Headers:**{

```http  "error": "Confirmation required",

Authorization: Bearer your-api-key  "message": "To delete your world, you must explicitly confirm this action.",

Content-Type: multipart/form-data  "hint": "Add ?confirm=true to the URL or include { \"confirm\": true } in the request body",

```  "example": "DELETE /api/world?confirm=true"

}

**Body:**```

- `stats` - One or more JSON files (multipart field name)

**Notes:**

**Response:**- Permanently deletes ALL data in `uploads/worlds/<userId>/`

```json- Cannot be undone

{- Required before uploading a new world

  "success": true,

  "playerCount": 3,---

  "players": [

    {### Cache Management

      "uuid": "550e8400-e29b-41d4-a716-446655440000",

      "name": "PlayerName",#### 🔒 `POST /api/cache/clear`

      "stats": {},

      "dataVersion": 3465Clear the Mojang player profile cache.

    }

  ]**Headers:**

}```http

```Authorization: Bearer your-api-key

```

---

**Response:**

#### `POST /api/upload/world````json

{

Upload and extract a Minecraft world zip file. **One world per user.**  "success": true,

  "message": "Cache cleared"

**Authentication:** Required}

```

**Headers:**

```http---

Authorization: Bearer your-api-key

Content-Type: multipart/form-data#### 🔒 `GET /api/cache/stats`

```

Get cache statistics.

**Body:**

- `world` - ZIP file containing your Minecraft world**Headers:**

```http

**Response:**Authorization: Bearer your-api-key

```json```

{

  "success": true,**Response:**

  "userId": "demo-user",```json

  "worldPath": "C:/path/to/uploads/worlds/demo-user",{

  "extractedFiles": 1234,  "size": 5,

  "message": "World uploaded and extracted successfully"  "players": ["uuid1", "uuid2", "uuid3"]

}}

``````



**Requirements:**---

- Must contain `stats/` or `playerdata/` folder

- Maximum file size: 100 MB### Admin Operations

- Must delete existing world first (see DELETE /api/world)

#### 🔒 `POST /admin/users`

**Error Response (World Already Exists - 409):**

```jsonCreate a new user and generate a secure API key. **Requires ADMIN_KEY.**

{

  "error": "World already exists",**Headers:**

  "message": "You already have a world uploaded. Delete it first using DELETE /api/world before uploading a new one.",```http

  "hint": "Use DELETE /api/world to remove your existing world data"Authorization: Bearer your-admin-key

}Content-Type: application/json

``````



---**Body:**

```json

### World Management{

  "userId": "new-user",

#### `DELETE /api/world`  "displayName": "New User Display Name"

}

Delete your entire world data. **Requires explicit confirmation.**```



**Authentication:** Required**Response:**

```json

**Headers:**{

```http  "success": true,

Authorization: Bearer your-api-key  "userId": "new-user",

```  "apiKey": "a2e52e1f88c1b4e3c513f5662e9101b627f262a0f53bc7d89b2bba2e7da622da",

  "displayName": "New User Display Name",

**Confirmation Options:**  "message": "User created successfully. Save the API key securely."

}

Option 1 - Query Parameter:```

```http

DELETE /api/world?confirm=true**Notes:**

```- Requires `ADMIN_KEY` environment variable

- API key is 64-character secure random hex string

Option 2 - Request Body:- User data saved to `data/users.json`

```json- **API key is only shown once** - save it immediately!

{

  "confirm": true---

}

```## 🚀 Installation



**Response:**```bash

```json# Install dependencies

{npm install

  "success": true,

  "message": "World deleted successfully",# Start server

  "userId": "demo-user"npm start

}

```# Development mode with auto-reload

npm run dev

**Error Response (Missing Confirmation - 400):**```

```json

{## ⚙️ Environment Variables

  "error": "Confirmation required",

  "message": "To delete your world, you must explicitly confirm this action.",Create a `.env` file in the root directory:

  "hint": "Add ?confirm=true to the URL or include { \"confirm\": true } in the request body",

  "example": "DELETE /api/world?confirm=true"```env

}# Server Port

```PORT=3000



**Notes:**# Admin Key (for creating users)

- Permanently deletes ALL data in `uploads/worlds/<userId>/`ADMIN_KEY=your-secure-admin-key-change-me

- Cannot be undone

- Required before uploading a new world# Optional: Direct API keys (comma-separated)

# Overrides users.json if set

---API_KEYS=



### Cache Management# Optional: Custom paths (defaults to uploads/worlds/<userId>)

# STATS_DIR=C:\\path\\to\\minecraft\\world\\stats

#### `POST /api/cache/clear`# PLAYERDATA_DIR=C:\\path\\to\\minecraft\\world\\playerdata

```

Clear the Mojang player profile cache.

---

**Authentication:** Required

## 🎯 Quick Start

**Headers:**

```http### 1. Start the Server

Authorization: Bearer your-api-key

``````bash

npm start

**Response:**```

```json

{Server will start on `http://localhost:3000`

  "success": true,

  "message": "Cache cleared"### 2. Test with Demo User

}

``````bash

# Check health

---curl http://localhost:3000/api/health



#### `GET /api/cache/stats`# Get user info

curl http://localhost:3000/api/me \

Get cache statistics.  -H "Authorization: Bearer demo-key-123456"

```

**Authentication:** Required

### 3. Upload a World

**Headers:**

```http```bash

Authorization: Bearer your-api-key# Upload world zip

```curl -X POST http://localhost:3000/api/upload/world \

  -H "Authorization: Bearer demo-key-123456" \

**Response:**  -F "world=@/path/to/world.zip"

```json```

{

  "size": 5,### 4. Get Player Stats

  "players": ["uuid1", "uuid2", "uuid3"]

}```bash

```# Get all players

curl http://localhost:3000/api/local/stats-with-inventory \

---  -H "Authorization: Bearer demo-key-123456"

```

### Admin Operations

---

#### `POST /admin/users`

## 💡 Usage Examples

Create a new user and generate a secure API key. **Requires ADMIN_KEY.**

### JavaScript/Fetch

**Authentication:** Required (Admin key)

```javascript

**Headers:**const apiKey = 'demo-key-123456';

```httpconst headers = { Authorization: `Bearer ${apiKey}` };

Authorization: Bearer your-admin-key

Content-Type: application/json// 1. Check authentication

```const user = await fetch('http://localhost:3000/api/me', { headers })

  .then(r => r.json());

**Body:**console.log('Logged in as:', user.displayName);

```json

{// 2. Upload world

  "userId": "new-user",const formData = new FormData();

  "displayName": "New User Display Name"formData.append('world', worldZipFile);

}const upload = await fetch('http://localhost:3000/api/upload/world', {

```  method: 'POST',

  headers,

**Response:**  body: formData

```json}).then(r => r.json());

{

  "success": true,// 3. Get all players

  "userId": "new-user",const stats = await fetch('http://localhost:3000/api/local/stats-with-inventory', { headers })

  "apiKey": "a2e52e1f88c1b4e3c513f5662e9101b627f262a0f53bc7d89b2bba2e7da622da",  .then(r => r.json());

  "displayName": "New User Display Name",console.log('Players:', stats.players);

  "message": "User created successfully. Save the API key securely."

}// 4. Hide a player

```await fetch('http://localhost:3000/api/players/filter', {

  method: 'POST',

**Notes:**  headers: { ...headers, 'Content-Type': 'application/json' },

- Requires `ADMIN_KEY` environment variable  body: JSON.stringify({ hiddenPlayers: ['uuid1', 'uuid2'] })

- API key is 64-character secure random hex string});

- User data saved to `data/users.json`

- **API key is only shown once** - save it immediately!// 5. Delete world

await fetch('http://localhost:3000/api/world?confirm=true', {

---  method: 'DELETE',

  headers

## Usage Examples});

```

### JavaScript/Fetch

### PowerShell

```javascript

const apiKey = 'demo-key-123456';```powershell

const headers = { Authorization: `Bearer ${apiKey}` };$apiKey = "demo-key-123456"

$headers = @{ Authorization = "Bearer $apiKey" }

// 1. Check authentication

const user = await fetch('http://localhost:3000/api/me', { headers })# Get user info

  .then(r => r.json());Invoke-RestMethod -Uri "http://localhost:3000/api/me" -Headers $headers

console.log('Logged in as:', user.displayName);

# Get all players

// 2. Upload world$players = Invoke-RestMethod -Uri "http://localhost:3000/api/local/stats-with-inventory" -Headers $headers

const formData = new FormData();$players.players | Format-Table name, playtime, deaths

formData.append('world', worldZipFile);

const upload = await fetch('http://localhost:3000/api/upload/world', {# Hide players

  method: 'POST',$filterHeaders = @{ 

  headers,  Authorization = "Bearer $apiKey"

  body: formData  "Content-Type" = "application/json"

}).then(r => r.json());}

$body = @{ hiddenPlayers = @("uuid1", "uuid2") } | ConvertTo-Json

// 3. Get all playersInvoke-RestMethod -Uri "http://localhost:3000/api/players/filter" -Method Post -Headers $filterHeaders -Body $body

const stats = await fetch('http://localhost:3000/api/local/stats-with-inventory', { headers })

  .then(r => r.json());# Delete world

console.log('Players:', stats.players);Invoke-RestMethod -Uri "http://localhost:3000/api/world?confirm=true" -Method Delete -Headers $headers

```

// 4. Hide a player

await fetch('http://localhost:3000/api/players/filter', {---

  method: 'POST',

  headers: { ...headers, 'Content-Type': 'application/json' },## 📊 Statistics Included

  body: JSON.stringify({ hiddenPlayers: ['uuid1', 'uuid2'] })

});The API extracts and formats these statistics:



// 5. Delete world| Stat | Description | Unit |

await fetch('http://localhost:3000/api/world?confirm=true', {|------|-------------|------|

  method: 'DELETE',| `playtime` | Total time played | minutes |

  headers| `deaths` | Total deaths | count |

});| `mobKills` | Mobs killed | count |

```| `playerKills` | Players killed | count |

| `blocksMined` | Total blocks mined | count |

### PowerShell| `jumps` | Times jumped | count |

| `distanceWalked` | Distance walked | blocks |

```powershell| `distanceSprinted` | Distance sprinted | blocks |

$apiKey = "demo-key-123456"| `distanceFlown` | Distance flown | blocks |

$headers = @{ Authorization = "Bearer $apiKey" }| `damageTaken` | Total damage taken | points |

| `damageDealt` | Total damage dealt | points |

# Get user info| `itemsEnchanted` | Items enchanted | count |

Invoke-RestMethod -Uri "http://localhost:3000/api/me" -Headers $headers| `animalsBreed` | Animals bred | count |

| `fishCaught` | Fish caught | count |

# Get all players

$players = Invoke-RestMethod -Uri "http://localhost:3000/api/local/stats-with-inventory" -Headers $headersPlus `rawStats` object with ALL Minecraft statistics.

$players.players | Format-Table name, playtime, deaths

---

# Hide players

$filterHeaders = @{ ## 🏗️ Architecture

  Authorization = "Bearer $apiKey"

  "Content-Type" = "application/json"### Per-User Isolation

}

$body = @{ hiddenPlayers = @("uuid1", "uuid2") } | ConvertTo-JsonEach user gets isolated storage:

Invoke-RestMethod -Uri "http://localhost:3000/api/players/filter" -Method Post -Headers $filterHeaders -Body $body

```

# Delete worlduploads/worlds/

Invoke-RestMethod -Uri "http://localhost:3000/api/world?confirm=true" -Method Delete -Headers $headers├── demo-user/

```│   ├── stats/

│   │   ├── player1.json

### cURL│   │   └── player2.json

│   ├── playerdata/

```bash│   │   ├── player1.dat

# Check authentication│   │   └── player2.dat

curl -H "Authorization: Bearer demo-key-123456" \│   └── player-filter.json

  http://localhost:3000/api/me├── hermit/

│   ├── stats/

# Upload world│   └── playerdata/

curl -X POST \└── snacks/

  -H "Authorization: Bearer demo-key-123456" \    ├── stats/

  -F "world=@/path/to/world.zip" \    └── playerdata/

  http://localhost:3000/api/upload/world```



# Get all players**How it works:**

curl -H "Authorization: Bearer demo-key-123456" \1. User authenticates with API key

  http://localhost:3000/api/local/stats-with-inventory2. Server maps API key → userId (from `data/users.json`)

3. All operations use `uploads/worlds/<userId>/`

# Hide players4. Users cannot access other users' data

curl -X POST \

  -H "Authorization: Bearer demo-key-123456" \### Storage Quotas

  -H "Content-Type: application/json" \

  -d '{"hiddenPlayers":["uuid1","uuid2"]}' \Per-user limits enforced:

  http://localhost:3000/api/players/filter- **500 MB** total storage

- **10,000** max files

# Delete world- Returns `413 Payload Too Large` when exceeded

curl -X DELETE \

  -H "Authorization: Bearer demo-key-123456" \---

  "http://localhost:3000/api/world?confirm=true"

```## 📦 Dependencies



---- **express** v5.1.0 - Web server framework

- **cors** v2.8.5 - CORS support

## Statistics Reference- **multer** v2.0.2 - File upload handling

- **axios** v1.12.2 - HTTP requests to Mojang API

The API extracts and formats these statistics:- **prismarine-nbt** v2.5.0 - NBT file parsing for inventory

- **helmet** v7.0.0 - Security headers

| Stat | Description | Unit |- **express-rate-limit** v7.0.0 - Rate limiting

|------|-------------|------|- **morgan** v1.10.0 - Request logging

| `playtime` | Total time played | minutes |- **adm-zip** - World zip extraction

| `deaths` | Total deaths | count |- **dotenv** - Environment variables

| `mobKills` | Mobs killed | count |

| `playerKills` | Players killed | count |---

| `blocksMined` | Total blocks mined | count |

| `jumps` | Times jumped | count |## 🛡️ Security Best Practices

| `distanceWalked` | Distance walked | blocks |

| `distanceSprinted` | Distance sprinted | blocks |### For Production

| `distanceFlown` | Distance flown | blocks |

| `damageTaken` | Total damage taken | points |- ✅ Use HTTPS (terminate TLS at reverse proxy)

| `damageDealt` | Total damage dealt | points |- ✅ Store `data/users.json` with proper file permissions (chmod 600)

| `itemsEnchanted` | Items enchanted | count |- ✅ Set strong `ADMIN_KEY` and rotate regularly

| `animalsBreed` | Animals bred | count |- ✅ Enable monitoring and error tracking (Sentry, Datadog)

| `fishCaught` | Fish caught | count |- ✅ Set up backups for `uploads/` and `data/`

- ✅ Consider migrating to database (SQLite/Postgres)

Plus `rawStats` object with ALL Minecraft statistics.- ✅ Move uploads to S3 or persistent storage

- ✅ Add tests and CI/CD pipeline

---- ✅ Implement user registration with email verification

- ✅ Add 2FA for admin operations

## Architecture

---

### Per-User Isolation

## 📝 License

Each user gets isolated storage:

MIT

```

uploads/worlds/---

├── demo-user/

│   ├── stats/## 🤝 Contributing

│   │   ├── player1.json

│   │   └── player2.jsonContributions welcome! Please open an issue or PR.

│   ├── playerdata/

│   │   ├── player1.dat---

│   │   └── player2.dat

│   └── player-filter.json## 📮 Support

├── user2/

│   ├── stats/For issues and questions, please open an issue on GitHub.

│   └── playerdata/

└── user3/## Authentication & Security

    ├── stats/

    └── playerdata/### API Keys

```Protected endpoints require an API key passed via the `Authorization` header:

```

**How it works:**Authorization: Bearer your-api-key-here

1. User authenticates with API key```

2. Server maps API key to userId (from `data/users.json`)

3. All operations use `uploads/worlds/<userId>/`**Demo API Key** (from `data/users.json`):

4. Users cannot access other users' data```

demo-key-123456

### Storage Quotas```



Per-user limits enforced:### Protected Endpoints

- **500 MB** total storageAll endpoints except `/api/health` require authentication:

- **10,000** max files- `GET /api/me` - Current user info

- Returns `413 Payload Too Large` when exceeded- `GET /api/config` - API configuration

- `GET /api/local/files` - List stats files

---- `GET /api/local/stats` - Get all player stats

- `GET /api/local/player/:uuid` - Get single player stats

## Security- `GET /api/local/inventory/:uuid` - Get player inventory

- `GET /api/local/stats-with-inventory` - Stats + inventory

### Production Best Practices- `GET /api/player/:uuid` - Mojang profile lookup

- `POST /api/upload` - Stats file upload

- Use HTTPS (terminate TLS at reverse proxy)- `POST /api/upload/world` - World zip upload

- Store `data/users.json` with proper file permissions (chmod 600)- `DELETE /api/world` - Delete your world data

- Set strong `ADMIN_KEY` and rotate regularly- `POST /api/process-directory` - Directory processing

- Enable monitoring and error tracking (Sentry, Datadog)- `POST /api/cache/clear` - Clear cache

- Set up backups for `uploads/` and `data/`- `GET /api/cache/stats` - Cache statistics

- Consider migrating to database (SQLite/Postgres)- `POST /admin/users` - User creation (requires `ADMIN_KEY` env var)

- Move uploads to S3 or persistent storage

- Add tests and CI/CD pipeline### Rate Limiting

- Implement user registration with email verification- Default: 120 requests per minute per IP

- Add 2FA for admin operations- Configurable via express-rate-limit settings



### Dependencies### Storage Quotas

- Per-user storage: 500 MB default

- **express** v5.1.0 - Web server framework- Max files: 10,000 per user

- **cors** v2.8.5 - CORS support- Returns `413 Payload Too Large` when exceeded

- **multer** v2.0.2 - File upload handling

- **axios** v1.12.2 - HTTP requests to Mojang API## API Endpoints

- **prismarine-nbt** v2.5.0 - NBT file parsing for inventory

- **helmet** v7.0.0 - Security headers### System & Configuration

- **express-rate-limit** v7.0.0 - Rate limiting

- **morgan** v1.10.0 - Request logging#### `GET /api/health`

- **adm-zip** - World zip extractionHealth check endpoint.

- **dotenv** - Environment variables

**Response:**

---```json

{

## License  "status": "ok",

  "timestamp": "2025-10-18T12:00:00.000Z"

MIT}

```

---

#### `GET /api/me`

## ContributingGet current authenticated user information.



Contributions welcome! Please open an issue or PR.**Headers:**

```

---Authorization: Bearer your-api-key

```

## Support

**Response:**

For issues and questions, please open an issue on GitHub.```json

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