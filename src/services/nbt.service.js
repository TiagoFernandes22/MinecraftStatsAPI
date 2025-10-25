const fs = require("fs").promises;
const path = require("path");
const nbt = require("prismarine-nbt");

class NBTService {
  /**
   * Read player inventory from NBT file
   */
  async readPlayerInventory(uuid, playerdataDir) {
    const candidates = [
      `${uuid}.dat`,
      `${uuid.replace(/-/g, "")}.dat`,
      `${uuid}.dat_old`,
      `${uuid.replace(/-/g, "")}.dat_old`,
    ];

    for (const filename of candidates) {
      const filePath = path.join(playerdataDir, filename);
      try {
        const buffer = await fs.readFile(filePath);
        const { parsed } = await nbt.parse(buffer);

        const inventory = [];
        let totalItems = 0;

        if (
          parsed.value.Inventory &&
          Array.isArray(parsed.value.Inventory.value.value)
        ) {
          for (const item of parsed.value.Inventory.value.value) {
            const slot = item.Slot?.value ?? -999;
            const id = item.id?.value?.replace("minecraft:", "") || "unknown";
            const count = item.Count?.value ?? 1;

            const enchantments = [];
            if (item.tag?.value?.Enchantments) {
              const enchs = item.tag.value.Enchantments.value.value;
              for (const ench of enchs) {
                enchantments.push({
                  id: ench.id?.value?.replace("minecraft:", "") || "unknown",
                  level: ench.lvl?.value ?? 0,
                });
              }
            }

            let customName = null;
            if (item.tag?.value?.display?.value?.Name) {
              try {
                const nameJson = JSON.parse(
                  item.tag.value.display.value.Name.value
                );
                customName = nameJson.text || null;
              } catch {
                customName = null;
              }
            }

            inventory.push({
              slot,
              id,
              name: customName,
              customName,
              count,
              enchantments,
            });

            totalItems += count;
          }
        }

        return {
          success: true,
          uuid,
          totalItems,
          inventory,
        };
      } catch (error) {
        // Continue to next candidate
        continue;
      }
    }

    // No file found
    return {
      success: true,
      uuid,
      totalItems: 0,
      inventory: [],
    };
  }
}

module.exports = new NBTService();
