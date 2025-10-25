const { formatItemName, sanitizeFilename } = require("../../src/utils/helpers");

describe("Helpers Utility", () => {
  describe("formatItemName", () => {
    it("should format item names correctly", () => {
      expect(formatItemName("diamond_sword")).toBe("Diamond Sword");
      expect(formatItemName("iron_pickaxe")).toBe("Iron Pickaxe");
      expect(formatItemName("golden_apple")).toBe("Golden Apple");
    });

    it("should handle items without underscores", () => {
      expect(formatItemName("dirt")).toBe("Dirt");
      expect(formatItemName("stone")).toBe("Stone");
    });

    it("should handle already formatted names", () => {
      expect(formatItemName("Diamond Sword")).toBe("Diamond Sword");
    });

    it("should handle empty or null values", () => {
      expect(formatItemName("")).toBe("Unknown");
      expect(formatItemName(null)).toBe("Unknown");
      expect(formatItemName(undefined)).toBe("Unknown");
    });

    it("should remove minecraft prefix if present", () => {
      expect(formatItemName("minecraft:diamond_sword")).toBe("Diamond Sword");
      expect(formatItemName("minecraft:iron_ore")).toBe("Iron Ore");
    });
  });

  describe("sanitizeFilename", () => {
    it("should remove invalid characters", () => {
      expect(sanitizeFilename("test<file>.json")).toBe("testfile.json");
      expect(sanitizeFilename("file|name?.txt")).toBe("filename.txt");
    });

    it("should handle valid filenames", () => {
      expect(sanitizeFilename("valid-file_name.json")).toBe(
        "valid-file_name.json"
      );
      expect(sanitizeFilename("123.txt")).toBe("123.txt");
    });

    it("should handle path separators", () => {
      expect(sanitizeFilename("path/to/file.json")).toBe("pathtofile.json");
      expect(sanitizeFilename("path\\to\\file.json")).toBe("pathtofile.json");
    });

    it("should return empty string for invalid input", () => {
      expect(sanitizeFilename("")).toBe("");
      expect(sanitizeFilename(null)).toBe("");
      expect(sanitizeFilename(undefined)).toBe("");
    });
  });
});
