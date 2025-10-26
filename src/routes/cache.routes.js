const express = require("express");
const router = express.Router();
const cacheController = require("../controllers/cache.controller");

/**
 * @swagger
 * /api/cache:
 *   delete:
 *     summary: Clear cache
 *     description: Clears all cached data (Mojang API responses, stats, etc.)
 *     tags: [Cache]
 *     security:
 *       - ApiKeyHeader: []
 *       - ApiKeyQuery: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cache cleared successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 */
router.delete("/", cacheController.clearCache);

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     description: Returns information about cached entries and memory usage
 *     tags: [Cache]
 *     security:
 *       - ApiKeyHeader: []
 *       - ApiKeyQuery: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     entries:
 *                       type: integer
 *                       description: Number of cached entries
 *                       example: 25
 *                     size:
 *                       type: string
 *                       description: Approximate memory usage
 *                       example: "2.50 KB"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 */
router.get("/stats", cacheController.getCacheStats);

module.exports = router;
