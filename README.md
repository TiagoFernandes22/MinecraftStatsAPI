# Minecraft Stats API

Node.js API for processing Minecraft world stats and player data.

## Quick Start

```bash
npm install
npm start
```

Server: `http://localhost:3000`

## Authentication

All endpoints require API key (except `/api/health`):

```http
Authorization: Bearer your-api-key
```

Demo API Key: `demo-key-123456`

## Endpoints

### System
- `GET /api/health` - Health check (no auth)
- `GET /api/me` - Current user info
- `GET /api/config` - API configuration

### Player Stats
- `GET /api/local/stats` - All player stats
- `GET /api/local/player/:uuid` - Single player stats
- `GET /api/local/inventory/:uuid` - Player inventory
- `GET /api/local/stats-with-inventory` - Stats + inventory (respects filter)

### Player Management
- `GET /api/players/all` - All players (unfiltered)
- `GET /api/players/filter` - Get hidden players
- `POST /api/players/filter` - Update filter
  - Body: `{"hiddenPlayers":["uuid1", "uuid2"]}`

### Upload & World
- `POST /api/upload/world` - Upload world zip
  - Body: `multipart/form-data` with field `world` (zip file)
- `DELETE /api/world` - Delete world

### Cache
- `POST /api/cache/clear` - Clear cache
- `GET /api/cache/stats` - Cache stats

### Admin
- `POST /admin/users` - Create user (requires ADMIN_KEY)
  - Body: `{"userId": "username", "displayName": "User Name"}`

## Examples

**Get stats:**
```bash
curl -H "Authorization: Bearer demo-key-123456" http://localhost:3000/api/local/stats
```

**Upload world:**
```bash
curl -X POST -H "Authorization: Bearer demo-key-123456" -F "world=@world.zip" http://localhost:3000/api/upload/world
```

**Hide players:**
```bash
curl -X POST -H "Authorization: Bearer demo-key-123456" -H "Content-Type: application/json" -d '{"hiddenPlayers":["uuid1","uuid2"]}' http://localhost:3000/api/players/filter
```

**Create user:**
```bash
curl -X POST -H "Authorization: Bearer admin-key" -H "Content-Type: application/json" -d '{"userId":"newuser","displayName":"New User"}' http://localhost:3000/admin/users
```

**Delete world:**
```bash
curl -X DELETE -H "Authorization: Bearer demo-key-123456" http://localhost:3000/api/world
```

## Features

- Per-user world isolation
- Player filtering (hide/show)
- NBT inventory parsing
- One world per user
- 500MB storage quota
- Rate limiting: 120 req/min

## License

MIT
