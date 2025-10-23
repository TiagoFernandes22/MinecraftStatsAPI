const nbt = require("prismarine-nbt");
const fs = require("fs").promises;
const path = require("path");

async function createPlayerData() {
  const playerdataDir = path.join(
    __dirname,
    "uploads",
    "worlds",
    "demo-user",
    "playerdata"
  );

  // Player 1: Full inventory with enchanted items and offhand
  const player1 = {
    name: "",
    type: "compound",
    value: {
      DataVersion: { type: "int", value: 3465 },
      Inventory: {
        type: "list",
        value: {
          type: "compound",
          value: [
            // Diamond Sword with Sharpness V in slot 0 (hotbar)
            {
              Slot: { type: "byte", value: 0 },
              id: { type: "string", value: "minecraft:diamond_sword" },
              Count: { type: "byte", value: 1 },
              components: {
                type: "compound",
                value: {
                  "minecraft:enchantments": {
                    type: "compound",
                    value: {
                      levels: {
                        type: "compound",
                        value: {
                          "minecraft:sharpness": { type: "int", value: 5 },
                          "minecraft:unbreaking": { type: "int", value: 3 },
                        },
                      },
                    },
                  },
                  "minecraft:custom_name": {
                    type: "string",
                    value: '"Legendary Blade"',
                  },
                },
              },
            },
            // Diamond Pickaxe with Fortune III in slot 1
            {
              Slot: { type: "byte", value: 1 },
              id: { type: "string", value: "minecraft:diamond_pickaxe" },
              Count: { type: "byte", value: 1 },
              components: {
                type: "compound",
                value: {
                  "minecraft:enchantments": {
                    type: "compound",
                    value: {
                      levels: {
                        type: "compound",
                        value: {
                          "minecraft:fortune": { type: "int", value: 3 },
                          "minecraft:efficiency": { type: "int", value: 5 },
                        },
                      },
                    },
                  },
                },
              },
            },
            // Diamond Blocks in slot 2
            {
              Slot: { type: "byte", value: 2 },
              id: { type: "string", value: "minecraft:diamond_block" },
              Count: { type: "byte", value: 64 },
            },
            // Ender Pearls in slot 8
            {
              Slot: { type: "byte", value: 8 },
              id: { type: "string", value: "minecraft:ender_pearl" },
              Count: { type: "byte", value: 16 },
            },
            // Shield in offhand (slot -106)
            {
              Slot: { type: "byte", value: -106 },
              id: { type: "string", value: "minecraft:shield" },
              Count: { type: "byte", value: 1 },
              components: {
                type: "compound",
                value: {
                  "minecraft:custom_name": {
                    type: "string",
                    value: '"Defender"',
                  },
                },
              },
            },
          ],
        },
      },
    },
  };

  // Player 2: Medium inventory with some items, no offhand
  const player2 = {
    name: "",
    type: "compound",
    value: {
      DataVersion: { type: "int", value: 3465 },
      Inventory: {
        type: "list",
        value: {
          type: "compound",
          value: [
            // Iron Sword in slot 0
            {
              Slot: { type: "byte", value: 0 },
              id: { type: "string", value: "minecraft:iron_sword" },
              Count: { type: "byte", value: 1 },
            },
            // Bow with Power IV in slot 1
            {
              Slot: { type: "byte", value: 1 },
              id: { type: "string", value: "minecraft:bow" },
              Count: { type: "byte", value: 1 },
              components: {
                type: "compound",
                value: {
                  "minecraft:enchantments": {
                    type: "compound",
                    value: {
                      levels: {
                        type: "compound",
                        value: {
                          "minecraft:power": { type: "int", value: 4 },
                        },
                      },
                    },
                  },
                },
              },
            },
            // Arrows in slot 2
            {
              Slot: { type: "byte", value: 2 },
              id: { type: "string", value: "minecraft:arrow" },
              Count: { type: "byte", value: 64 },
            },
            // Golden Apples in slot 7
            {
              Slot: { type: "byte", value: 7 },
              id: { type: "string", value: "minecraft:golden_apple" },
              Count: { type: "byte", value: 8 },
            },
          ],
        },
      },
    },
  };

  // Player 3: Empty inventory (no items at all)
  const player3 = {
    name: "",
    type: "compound",
    value: {
      DataVersion: { type: "int", value: 3465 },
      Inventory: {
        type: "list",
        value: {
          type: "compound",
          value: [],
        },
      },
    },
  };

  // Write the files
  const players = [
    { uuid: "550e8400-e29b-41d4-a716-446655440000", data: player1 },
    { uuid: "660e8400-e29b-41d4-a716-446655440001", data: player2 },
    { uuid: "770e8400-e29b-41d4-a716-446655440002", data: player3 },
  ];

  for (const player of players) {
    const buffer = nbt.writeUncompressed(player.data, "big");
    const filePath = path.join(playerdataDir, `${player.uuid}.dat`);
    await fs.writeFile(filePath, buffer);
    console.log(`Created ${player.uuid}.dat`);
  }

  console.log("All playerdata files created successfully!");
}

createPlayerData().catch(console.error);
