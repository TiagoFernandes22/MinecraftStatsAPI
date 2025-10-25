const axios = require("axios");
const cache = require("../utils/cache");

class MojangService {
  async fetchPlayerProfile(uuid) {
    // Check cache first
    const cached = cache.get(uuid);
    if (cached) {
      return cached;
    }

    try {
      // Remove dashes from UUID if present
      const cleanUuid = uuid.replace(/-/g, "");

      // Fetch profile from Mojang API
      const response = await axios.get(
        `https://sessionserver.mojang.com/session/minecraft/profile/${cleanUuid}`,
        { timeout: 5000 }
      );

      const profile = {
        uuid: uuid,
        name: response.data.name,
        skin: null,
        cape: null,
      };

      // Parse skin texture data
      if (response.data.properties) {
        const textureProperty = response.data.properties.find(
          (p) => p.name === "textures"
        );
        if (textureProperty) {
          const textures = JSON.parse(
            Buffer.from(textureProperty.value, "base64").toString()
          );
          if (textures.textures) {
            profile.skin = textures.textures.SKIN?.url || null;
            profile.cape = textures.textures.CAPE?.url || null;
          }
        }
      }

      // Cache the result
      cache.set(uuid, profile);

      return profile;
    } catch (error) {
      console.error(`Error fetching profile for ${uuid}:`, error.message);

      // Return UUID as fallback
      return {
        uuid: uuid,
        name: uuid.substring(0, 8), // Shortened UUID as fallback
        skin: null,
        cape: null,
        error: "Could not fetch player data",
      };
    }
  }
}

module.exports = new MojangService();
