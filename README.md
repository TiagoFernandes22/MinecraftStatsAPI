# Minecraft Stats API

Node.js API for processing Minecraft world stats and player data.

## Quick Start

```bash
npm install
npm start
```

Server: `http://localhost:3000`

## Authentication

All endpoints require API key (except `/health`):

```http
Authorization: Bearer your-api-key
```

Demo API Key: `demo-key-123456`

## Endpoints

### System
- `GET /health` - Health check (no auth)
- `GET /api/me` - Current user info

### Player Stats
- `GET /api/local/stats` - All player stats (basic info only)
  - Returns: `uuid`, `name`, `skin`, `cape`, `stats` (summarized), `rawStats` (full Minecraft stats), `dataVersion`
- `GET /api/local/stats/:uuid` - Single player stats
  - Returns: Same as above for specific player
- `GET /api/local/stats-with-inventory` - All stats + inventory (respects player filter)
  - Returns: Same as `/api/players/:uuid` for each player

### Player Data
- `GET /api/players/all` - All players with stats (unfiltered)
  - Returns: Array of players with `stats`, `rawStats`, and `inventory`
- `GET /api/players/:uuid` - Single player with stats + inventory
  - Returns: `uuid`, `name`, `skin`, `cape`, `stats` (summarized), `rawStats` (full Minecraft stats), `inventory`, `totalItems`
- `GET /api/players/:uuid/inventory` - Player inventory only
- `GET /api/local/player/:uuid` - Player data (backward compatibility)
- `GET /api/local/inventory/:uuid` - Player inventory (backward compatibility)
- `POST /api/players/filter` - Get filtered players by UUID list
  - Body: `{"uuids": ["uuid1", "uuid2"]}`

### Player Filter Management
- `GET /api/players/hidden` - Get list of hidden players
- `POST /api/players/hidden` - Update hidden players list
  - Body: `{"hiddenPlayers": ["uuid1", "uuid2"]}`
- `PUT /api/players/hidden` - Update hidden players list (RESTful)
  - Body: `{"hiddenPlayers": ["uuid1", "uuid2"]}`

### Mojang API
- `GET /api/mojang/:uuid` - Get Mojang player profile

### World Management
- `POST /api/upload/world` - Upload world zip
  - Body: `multipart/form-data` with field `world` (zip file)
- `DELETE /api/world` - Delete world
- `GET /api/world/info` - Get world information
- `GET /api/storage` - Get storage statistics

### Cache
- `POST /api/cache/clear` - Clear cache
- `GET /api/cache/stats` - Cache statistics

### Admin (requires ADMIN_KEY)
- `POST /admin/users` - Create user
  - Body: `{"userId": "username", "displayName": "User Name"}`
- `GET /admin/users` - List all users
- `GET /admin/users/:username` - Get user details
- `PUT /admin/users/:username` - Update user
  - Body: `{"displayName": "New Name"}`
- `DELETE /admin/users/:username` - Delete user

## Examples

**Get all stats:**
```bash
curl -H "Authorization: Bearer demo-key-123456" \
  http://localhost:3000/api/local/stats
```

**Get stats with inventory (respects filter):**
```bash
curl -H "Authorization: Bearer demo-key-123456" \
  http://localhost:3000/api/local/stats-with-inventory
```

**Get specific player:**
```bash
curl -H "Authorization: Bearer demo-key-123456" \
  http://localhost:3000/api/players/550e8400-e29b-41d4-a716-446655440000
```

**Get filtered players:**
```bash
curl -X POST -H "Authorization: Bearer demo-key-123456" \
  -H "Content-Type: application/json" \
  -d '{"uuids":["uuid1","uuid2"]}' \
  http://localhost:3000/api/players/filter
```

**Get hidden players list:**
```bash
curl -H "Authorization: Bearer demo-key-123456" \
  http://localhost:3000/api/players/hidden
```

**Hide/unhide players:**
```bash
curl -X POST -H "Authorization: Bearer demo-key-123456" \
  -H "Content-Type: application/json" \
  -d '{"hiddenPlayers":["uuid1","uuid2"]}' \
  http://localhost:3000/api/players/hidden
```

**Upload world:**
```bash
curl -X POST -H "Authorization: Bearer demo-key-123456" \
  -F "world=@world.zip" \
  http://localhost:3000/api/upload/world
```

**Delete world:**
```bash
curl -X DELETE -H "Authorization: Bearer demo-key-123456" \
  http://localhost:3000/api/world
```

**Create user (admin):**
```bash
curl -X POST -H "Authorization: Bearer admin-key" \
  -H "Content-Type: application/json" \
  -d '{"userId":"newuser","displayName":"New User"}' \
  http://localhost:3000/admin/users
```

**Update user (admin):**
```bash
curl -X PUT -H "Authorization: Bearer admin-key" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Updated Name"}' \
  http://localhost:3000/admin/users/newuser
```

**Delete user (admin):**
```bash
curl -X DELETE -H "Authorization: Bearer admin-key" \
  http://localhost:3000/admin/users/newuser
```

## Features

- **Per-user world isolation** - Each API key has its own world directory
- **Player filtering** - Hide/show specific players via `player-filter.json`
- **NBT inventory parsing** - Read Minecraft .dat files
- **Parallel processing** - Fast stats for 50+ players using Promise.all
- **Storage management** - 500MB quota per user, 10k file limit
- **Rate limiting** - 120 requests/minute per IP
- **Comprehensive testing** - 82 tests (21 unit, 61 integration)
- **Backward compatibility** - Old endpoint paths still work

## Player Filter

Each user can maintain a `player-filter.json` in their world directory:

```json
{
  "hiddenPlayers": [
    "uuid1",
    "uuid2"
  ],
  "updatedAt": "2025-10-25T12:00:00.000Z"
}
```

Hidden players are filtered from:
- `GET /api/local/stats-with-inventory`
- `POST /api/players/filter`

Unfiltered endpoints (for management):
- `GET /api/players/all`

## Response Format

### Player Stats Response

All player endpoints return both summarized stats and raw Minecraft statistics:

```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "name": "PlayerName",
  "skin": "http://textures.minecraft.net/texture/...",
  "cape": "http://textures.minecraft.net/texture/...",
  "stats": {
    "playtime": 7929,
    "deaths": 20,
    "mobKills": 13702,
    "playerKills": 2,
    "blocksMined": 141321,
    "jumps": 159602,
    "distanceWalked": 196312,
    "distanceSprinted": 211017,
    "distanceFlown": 362885,
    "damageTaken": 9382,
    "damageDealt": 32657,
    "itemsEnchanted": 99,
    "animalsBreed": 32,
    "fishCaught": 12
  },
  "rawStats": {
    "minecraft:custom": {
      "minecraft:play_time": 475740,
      "minecraft:walk_one_cm": 19631200,
      "minecraft:sprint_one_cm": 21101700,
      "minecraft:fly_one_cm": 36288500,
      "minecraft:jump": 159602,
      "minecraft:deaths": 20,
      "minecraft:mob_kills": 13702,
      "minecraft:player_kills": 2,
      "minecraft:damage_taken": 93820,
      "minecraft:damage_dealt": 326570
    },
    "minecraft:mined": {
      "minecraft:stone": 50234,
      "minecraft:dirt": 12456,
      "minecraft:deepslate": 8942
    },
    "minecraft:used": {
      "minecraft:diamond_pickaxe": 15234,
      "minecraft:golden_carrot": 450
    },
    "minecraft:crafted": {
      "minecraft:torch": 1024,
      "minecraft:crafting_table": 5
    },
    "minecraft:killed": {
      "minecraft:zombie": 450,
      "minecraft:creeper": 120,
      "minecraft:enderman": 89
    },
    "minecraft:killed_by": {
      "minecraft:zombie": 5,
      "minecraft:creeper": 3
    },
    "minecraft:picked_up": {
      "minecraft:cobblestone": 30000
    },
    "minecraft:dropped": {
      "minecraft:dirt": 500
    }
  },
  "inventory": [...],
  "totalItems": 156,
  "dataVersion": 3465
}
```

**Stats Fields:**
- `stats` - Summarized statistics with human-readable values (playtime in minutes, distances in blocks, etc.)
- `rawStats` - Complete Minecraft statistics JSON with all categories and original values
- `dataVersion` - Minecraft data version number

**Raw Stats Categories:**
- `minecraft:custom` - Custom statistics (playtime, movement, combat, etc.)
- `minecraft:mined` - Blocks mined by type
- `minecraft:used` - Items used by type
- `minecraft:crafted` - Items crafted by type
- `minecraft:killed` - Mobs killed by type
- `minecraft:killed_by` - Deaths by mob type
- `minecraft:picked_up` - Items picked up by type
- `minecraft:dropped` - Items dropped by type
- And any other categories present in the player's stats file

## Environment Variables

```env
PORT=3000
NODE_ENV=development
ADMIN_KEY=your-admin-key
```

## Testing

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

## License

MIT
