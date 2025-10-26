/**
 * Centralized Swagger/OpenAPI Path Definitions
 * All endpoint documentation in one place
 */

module.exports = {
  // ============================================================================
  // HEALTH ENDPOINTS
  // ============================================================================
  "/health": {
    get: {
      summary: "Health check",
      description: "Returns API health status (no authentication required)",
      tags: ["Health"],
      responses: {
        200: {
          description: "API is healthy",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  status: { type: "string", example: "healthy" },
                },
              },
            },
          },
        },
      },
    },
  },

  "/api/me": {
    get: {
      summary: "Get current user info",
      description: "Returns information about the authenticated user",
      tags: ["Health"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      responses: {
        200: {
          description: "User info retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string", example: "demo-user" },
                  displayName: { type: "string", example: "Demo User" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================
  "/admin/users": {
    post: {
      summary: "Create a new user",
      description:
        "Creates a new user with a unique userId and generates an API key",
      tags: ["Admin"],
      security: [{ AdminKey: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["userId", "displayName"],
              properties: {
                userId: {
                  type: "string",
                  pattern: "^[a-zA-Z0-9_.-]+$",
                  minLength: 3,
                  maxLength: 30,
                  description:
                    "Unique user identifier (letters, numbers, hyphens, underscores, periods)",
                  example: "demo-user",
                },
                displayName: {
                  type: "string",
                  minLength: 1,
                  maxLength: 50,
                  description: "Display name for the user",
                  example: "Demo User",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "User created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  user: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
    get: {
      summary: "List all users",
      description: "Returns a list of all users (API keys are hidden)",
      tags: ["Admin"],
      security: [{ AdminKey: [] }],
      responses: {
        200: {
          description: "List of users retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  users: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        userId: { type: "string", example: "demo-user" },
                        displayName: { type: "string", example: "Demo User" },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/admin/users/{userId}": {
    get: {
      summary: "Get user by ID",
      description: "Returns detailed information about a specific user",
      tags: ["Admin"],
      security: [{ AdminKey: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string" },
          description: "User ID",
          example: "demo-user",
        },
      ],
      responses: {
        200: {
          description: "User retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  user: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
    put: {
      summary: "Update user",
      description: "Updates a user's display name",
      tags: ["Admin"],
      security: [{ AdminKey: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string" },
          description: "User ID",
          example: "demo-user",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["displayName"],
              properties: {
                displayName: {
                  type: "string",
                  minLength: 1,
                  maxLength: 50,
                  description: "New display name",
                  example: "Updated Name",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "User updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  user: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
    delete: {
      summary: "Delete user",
      description: "Deletes a user and their associated data",
      tags: ["Admin"],
      security: [{ AdminKey: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string" },
          description: "User ID",
          example: "demo-user",
        },
      ],
      responses: {
        200: {
          description: "User deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "User deleted successfully",
                  },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/admin/users/{userId}/regenerate-key": {
    post: {
      summary: "Regenerate API key",
      description:
        "Generates a new API key for the user, invalidating the old one",
      tags: ["Admin"],
      security: [{ AdminKey: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string" },
          description: "User ID",
          example: "demo-user",
        },
      ],
      responses: {
        200: {
          description: "API key regenerated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  user: { $ref: "#/components/schemas/User" },
                  oldKeyPartial: {
                    type: "string",
                    description:
                      "First 8 characters of old API key for reference",
                    example: "a1b2c3d4",
                  },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/admin/storage": {
    get: {
      summary: "Get storage statistics for all users",
      description:
        "Returns storage usage information for all users in the system",
      tags: ["Admin"],
      security: [{ AdminKey: [] }],
      responses: {
        200: {
          description: "Storage statistics retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  users: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        userId: { type: "string", example: "demo-user" },
                        displayName: { type: "string", example: "Demo User" },
                        storage: { $ref: "#/components/schemas/StorageInfo" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  // ============================================================================
  // PLAYER ENDPOINTS
  // ============================================================================
  "/api/players/all": {
    get: {
      summary: "Get all players",
      description:
        "Returns statistics and inventory data for all players in the world",
      tags: ["Players"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      responses: {
        200: {
          description: "Players retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  players: {
                    type: "array",
                    items: {
                      allOf: [
                        { $ref: "#/components/schemas/PlayerStats" },
                        { $ref: "#/components/schemas/Inventory" },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/api/players/hidden": {
    get: {
      summary: "Get hidden players list",
      description:
        "Returns the list of player UUIDs that are hidden from queries",
      tags: ["Players"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      responses: {
        200: {
          description: "Hidden players list retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  hiddenPlayers: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                    example: ["550e8400-e29b-41d4-a716-446655440000"],
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
    put: {
      summary: "Update hidden players list",
      description: "Updates the list of player UUIDs to hide from queries",
      tags: ["Players"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["hiddenPlayers"],
              properties: {
                hiddenPlayers: {
                  type: "array",
                  items: { type: "string", format: "uuid" },
                  description: "Array of player UUIDs to hide",
                  example: [
                    "550e8400-e29b-41d4-a716-446655440000",
                    "660e8400-e29b-41d4-a716-446655440001",
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Hidden players list updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Player filter updated successfully",
                  },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
    post: {
      summary: "Update hidden players list (deprecated)",
      description:
        "Updates the list of player UUIDs to hide from queries. Use PUT method instead.",
      deprecated: true,
      tags: ["Players"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["hiddenPlayers"],
              properties: {
                hiddenPlayers: {
                  type: "array",
                  items: { type: "string", format: "uuid" },
                  example: ["550e8400-e29b-41d4-a716-446655440000"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Hidden players list updated successfully" },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  "/api/players/filter": {
    post: {
      summary: "Get filtered players",
      description:
        "Returns statistics and inventory for specific players by UUID list",
      tags: ["Players"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["uuids"],
              properties: {
                uuids: {
                  type: "array",
                  items: { type: "string", format: "uuid" },
                  minItems: 1,
                  description: "Array of player UUIDs to retrieve",
                  example: [
                    "550e8400-e29b-41d4-a716-446655440000",
                    "660e8400-e29b-41d4-a716-446655440001",
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Filtered players retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  players: {
                    type: "array",
                    items: {
                      allOf: [
                        { $ref: "#/components/schemas/PlayerStats" },
                        { $ref: "#/components/schemas/Inventory" },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/api/players/{uuid}/inventory": {
    get: {
      summary: "Get player inventory",
      description:
        "Returns inventory, armor, and ender chest data for a specific player",
      tags: ["Players"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "uuid",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Player UUID",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
      ],
      responses: {
        200: {
          description: "Player inventory retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  inventory: { $ref: "#/components/schemas/Inventory" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/api/players/{uuid}": {
    get: {
      summary: "Get player details",
      description:
        "Returns complete player information including stats and inventory",
      tags: ["Players"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "uuid",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Player UUID",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
      ],
      responses: {
        200: {
          description: "Player details retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  player: {
                    allOf: [
                      { $ref: "#/components/schemas/PlayerStats" },
                      { $ref: "#/components/schemas/Inventory" },
                    ],
                  },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  // ============================================================================
  // WORLD ENDPOINTS
  // ============================================================================
  "/api/upload/world": {
    post: {
      summary: "Upload Minecraft world",
      description:
        "Uploads a Minecraft world ZIP file containing stats and playerdata folders. Maximum 5 uploads per hour.",
      tags: ["World"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["world"],
              properties: {
                world: {
                  type: "string",
                  format: "binary",
                  description:
                    "ZIP file containing Minecraft world data (stats/ and playerdata/ folders)",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "World uploaded successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "World uploaded successfully",
                  },
                  stats: {
                    type: "object",
                    properties: {
                      statsFiles: { type: "integer", example: 10 },
                      playerdataFiles: { type: "integer", example: 10 },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Invalid file or world already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        409: {
          description: "World already exists - use PUT to replace",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string", example: "World already exists" },
                  existingWorld: { $ref: "#/components/schemas/WorldInfo" },
                },
              },
            },
          },
        },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/api/world": {
    put: {
      summary: "Replace existing world",
      description:
        "Replaces the existing Minecraft world with a new one. Returns 404 if no world exists.",
      tags: ["World"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["world"],
              properties: {
                world: {
                  type: "string",
                  format: "binary",
                  description: "ZIP file containing new Minecraft world data",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "World replaced successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "World replaced successfully",
                  },
                  stats: {
                    type: "object",
                    properties: {
                      statsFiles: { type: "integer" },
                      playerdataFiles: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Invalid file format",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: {
          description: "No existing world to replace - use POST to upload",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
    delete: {
      summary: "Delete world",
      description:
        "Deletes the uploaded Minecraft world and all associated data",
      tags: ["World"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      responses: {
        200: {
          description: "World deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "World deleted successfully",
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/api/world/info": {
    get: {
      summary: "Get world information",
      description:
        "Returns information about the uploaded world including file counts and size",
      tags: ["World"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      responses: {
        200: {
          description: "World information retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  world: { $ref: "#/components/schemas/WorldInfo" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/api/storage": {
    get: {
      summary: "Get storage statistics",
      description:
        "Returns storage usage information for the authenticated user",
      tags: ["World"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      responses: {
        200: {
          description: "Storage statistics retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  storage: { $ref: "#/components/schemas/StorageInfo" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  // ============================================================================
  // MOJANG ENDPOINTS
  // ============================================================================
  "/api/mojang/{uuid}": {
    get: {
      summary: "Get Mojang profile",
      description:
        "Fetches player profile information from Mojang API (cached for performance). Rate limited to 20 requests per 5 minutes.",
      tags: ["Mojang"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "uuid",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Player UUID",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
      ],
      responses: {
        200: {
          description: "Mojang profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  profile: {
                    type: "object",
                    properties: {
                      uuid: {
                        type: "string",
                        format: "uuid",
                        example: "550e8400-e29b-41d4-a716-446655440000",
                      },
                      name: { type: "string", example: "Notch" },
                      properties: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string", example: "textures" },
                            value: {
                              type: "string",
                              description: "Base64 encoded texture data",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: {
          description: "Player not found in Mojang database",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  // ============================================================================
  // CACHE ENDPOINTS
  // ============================================================================
  "/api/cache": {
    delete: {
      summary: "Clear cache",
      description: "Clears all cached data (Mojang profiles, etc.)",
      tags: ["Cache"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      responses: {
        200: {
          description: "Cache cleared successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Cache cleared successfully",
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/api/cache/stats": {
    get: {
      summary: "Get cache statistics",
      description: "Returns statistics about cached data (size, entry count)",
      tags: ["Cache"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      responses: {
        200: {
          description: "Cache statistics retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  cache: {
                    type: "object",
                    properties: {
                      size: { type: "integer", example: 5 },
                      entries: { type: "integer", example: 5 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  // ============================================================================
  // STATS ENDPOINTS (Legacy/Backward Compatibility)
  // ============================================================================
  "/api/local/stats": {
    get: {
      summary: "Get all player stats (legacy)",
      description:
        "Returns statistics for all players. Use /api/players/all for new implementations.",
      tags: ["Stats"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      responses: {
        200: {
          description: "Stats retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  stats: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PlayerStats" },
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/api/local/stats-with-inventory": {
    get: {
      summary: "Get all player stats with inventory (legacy)",
      description:
        "Returns statistics and inventory for all players. Use /api/players/all for new implementations.",
      tags: ["Stats"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      responses: {
        200: {
          description: "Stats with inventory retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  stats: {
                    type: "array",
                    items: {
                      allOf: [
                        { $ref: "#/components/schemas/PlayerStats" },
                        { $ref: "#/components/schemas/Inventory" },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/api/local/stats/{uuid}": {
    get: {
      summary: "Get player stats by UUID (legacy)",
      description:
        "Returns statistics for a specific player. Use /api/players/{uuid} for new implementations.",
      tags: ["Stats"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "uuid",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Player UUID",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
      ],
      responses: {
        200: {
          description: "Player stats retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  stats: { $ref: "#/components/schemas/PlayerStats" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
        429: { $ref: "#/components/responses/RateLimitExceeded" },
      },
    },
  },

  "/api/local/inventory/{uuid}": {
    get: {
      summary: "Get player inventory (deprecated)",
      description:
        "Returns player inventory. Use /api/players/{uuid}/inventory instead.",
      deprecated: true,
      tags: ["Stats"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "uuid",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Player UUID",
        },
      ],
      responses: {
        200: { description: "Player inventory retrieved successfully" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
  },

  "/api/local/player/{uuid}": {
    get: {
      summary: "Get player details (deprecated)",
      description:
        "Returns complete player information. Use /api/players/{uuid} instead.",
      deprecated: true,
      tags: ["Stats"],
      security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }, { BearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "uuid",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Player UUID",
        },
      ],
      responses: {
        200: { description: "Player details retrieved successfully" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
  },
};
