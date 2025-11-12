const cache = require("../utils/cache");

class CacheController {
  /**
   * DELETE /api/cache
   * Clear cache
   */
  clearCache(req, res, next) {
    try {
      cache.clear();

      res.json({
        success: true,
        message: "Cache cleared",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/cache/stats
   * Get cache statistics
   */
  getCacheStats(req, res, next) {
    try {
      const stats = cache.getStats();

      res.json({
        success: true,
        cache: {
          size: stats.size,
          entries: stats.entries,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CacheController();
