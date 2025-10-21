# 🎒 Player Inventory Feature

## Overview
The API can now read and display player inventories from Minecraft world playerdata files!

## Setup Instructions

### 1. Locate Your World's Playerdata Folder

Your Minecraft world contains a `playerdata` folder with `.dat` files:

```
YourWorld/
├── stats/              # Already used for stats
│   └── {uuid}.json
├── playerdata/         # NEW: For inventories
│   └── {uuid}.dat      # NBT binary files
└── level.dat
```

**Typical paths:**
- **Server**: `C:\path\to\server\world\playerdata\`
- **Singleplayer**: `C:\Users\{YOU}\AppData\Roaming\.minecraft\saves\{WorldName}\playerdata\`

### 2. Copy Playerdata Files

Copy the `.dat` files from your world to this API's folder:

```powershell
# Option A: Copy files manually
Copy-Item "C:\path\to\world\playerdata\*.dat" -Destination "C:\Users\ASUS\Desktop\MinecraftStatsAPI\uploads\playerdata\"

# Option B: Set environment variable to point directly to your world
"PLAYERDATA_DIR=C:\\path\\to\\world\\playerdata" | Out-File -FilePath .env -Append -Encoding ascii
```

### 3. Restart the Server

```powershell
npm start
```

## New API Endpoints

### `GET /api/local/inventory/:uuid`
Get a single player's inventory.

**Example:**
```powershell
Invoke-RestMethod http://localhost:3000/api/local/inventory/069a79f4-44e9-4726-a5be-fca90e38aaf5
```

**Response:**
```json
{
  "success": true,
  "uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  "totalItems": 23,
  "inventory": [
    {
      "slot": 0,
      "id": "minecraft:diamond_sword",
      "name": "Diamond Sword",
      "count": 1,
      "enchantments": [
        { "id": "minecraft:sharpness", "level": 5 },
        { "id": "minecraft:unbreaking", "level": 3 }
      ]
    },
    {
      "slot": 1,
      "id": "minecraft:golden_apple",
      "name": "Golden Apple",
      "count": 16,
      "enchantments": []
    }
  ]
}
```

### `GET /api/local/stats-with-inventory`
Get all players with both stats AND inventories combined.

**Example:**
```powershell
Invoke-RestMethod http://localhost:3000/api/local/stats-with-inventory
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
      "stats": { ... },
      "inventory": [ ... ],
      "inventoryCount": 23
    }
  ]
}
```

## What Data is Extracted?

From each inventory item:
- ✅ **Item ID** (e.g., `minecraft:diamond_sword`)
- ✅ **Formatted Name** (e.g., "Diamond Sword")
- ✅ **Count/Stack Size**
- ✅ **Slot Number** (0-35 = main inventory, 100-103 = armor, -106 = offhand)
- ✅ **Enchantments** (ID and level)
- ✅ **Custom Names** (if renamed with anvil)

## Inventory Slots Explained

- **0-8**: Hotbar
- **9-35**: Main inventory
- **100**: Boots
- **101**: Leggings  
- **102**: Chestplate
- **103**: Helmet
- **-106**: Offhand

## Using the API Tester

1. Open `api-tester.html` in your browser
2. Go to **Section 5: Player Inventory**
3. Enter a player UUID and click "Get Inventory"
4. Or click "Get All Players + Inventories" to see everyone

## Environment Variables

Add to your `.env` file:

```env
# Point to your world's playerdata folder
PLAYERDATA_DIR=C:\\path\\to\\world\\playerdata

# Or use the default (uploads/playerdata)
# PLAYERDATA_DIR=uploads/playerdata
```

## Troubleshooting

**"Playerdata directory not found"**
- Check your PLAYERDATA_DIR path in `.env`
- Ensure the folder exists and contains `.dat` files

**"Player data file not found"**
- Verify the UUID matches a `.dat` filename
- The player must have logged into the world at least once

**Empty inventory array**
- The player might have an empty inventory
- Check the raw JSON response for errors

## Technical Details

- Uses `prismarine-nbt` library to parse Minecraft's NBT (Named Binary Tag) format
- Supports both dashed and non-dashed UUIDs
- Handles enchanted items, custom names, and all inventory slots
- Automatically formats item IDs to readable names
