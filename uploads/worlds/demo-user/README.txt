Demo World for demo-user
========================

This is a sample world with 3 demo players for testing the API.

Players:
--------
1. UUID: 550e8400-e29b-41d4-a716-446655440000
   - Playtime: 1 hour
   - Deaths: 5
   - Mob kills: 150
   - Diamonds mined: 45
   - Inventory: 5 items
     * Diamond Sword "Legendary Blade" (Sharpness V, Unbreaking III)
     * Diamond Pickaxe (Fortune III, Efficiency V)
     * Diamond Block x64
     * Ender Pearl x16
     * Shield "Defender" (OFFHAND)

2. UUID: 660e8400-e29b-41d4-a716-446655440001
   - Playtime: 2 hours
   - Deaths: 12
   - Mob kills: 300
   - Diamonds mined: 89
   - Inventory: 4 items
     * Iron Sword
     * Bow (Power IV)
     * Arrow x64
     * Golden Apple x8

3. UUID: 770e8400-e29b-41d4-a716-446655440002
   - Playtime: 30 minutes
   - Deaths: 3
   - Mob kills: 75
   - Diamonds mined: 23
   - Inventory: EMPTY (no items)

Usage:
------
Test with API key: demo-key-123456

Example API call:
GET http://localhost:3000/api/local/stats
Authorization: Bearer demo-key-123456
