const swaggerJsdoc = require("swagger-jsdoc");
const swaggerPaths = require("./swagger-paths");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Minecraft Stats API",
      version: "1.0.0",
      description:
        "A RESTful API for managing and retrieving Minecraft player statistics, inventory data, and world information. Upload your Minecraft world and access comprehensive player analytics through a secure, rate-limited API.",
      license: {
        name: "MIT",
        url: "https://github.com/TiagoFernandes22/MinecraftStatsAPI/blob/master/LICENSE",
      },
      contact: {
        name: "Tiago Fernandes",
        url: "https://github.com/TiagoFernandes22/MinecraftStatsAPI",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.yourserver.com",
        description: "Production server",
      },
    ],
    paths: swaggerPaths, // Centralized path definitions
    components: {
      securitySchemes: {
        ApiKeyHeader: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API key for user authentication",
        },
        ApiKeyQuery: {
          type: "apiKey",
          in: "query",
          name: "apiKey",
          description: "API key as query parameter (alternative to header)",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Bearer token authentication (alternative format)",
        },
        AdminKey: {
          type: "apiKey",
          in: "header",
          name: "x-admin-key",
          description: "Admin key for administrative operations",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "Unique user identifier",
              example: "demo-user",
            },
            displayName: {
              type: "string",
              description: "Display name for the user",
              example: "Demo User",
            },
            apiKey: {
              type: "string",
              description:
                "User's API key (only shown on creation/regeneration)",
              example: "a1b2c3d4e5f6...",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "User creation timestamp",
            },
            keyRegeneratedAt: {
              type: "string",
              format: "date-time",
              description: "Last API key regeneration timestamp",
            },
          },
        },
        PlayerStats: {
          type: "object",
          properties: {
            uuid: {
              type: "string",
              format: "uuid",
              description: "Player UUID",
              example: "550e8400-e29b-41d4-a716-446655440000",
            },
            name: {
              type: "string",
              description: "Player name from Mojang API",
              example: "Notch",
            },
            stats: {
              type: "object",
              properties: {
                deaths: { type: "integer", example: 5 },
                playTime: {
                  type: "integer",
                  description: "In ticks",
                  example: 1000000,
                },
                mobKills: { type: "integer", example: 150 },
                playerKills: { type: "integer", example: 3 },
                jumps: { type: "integer", example: 5000 },
                distanceWalked: {
                  type: "integer",
                  description: "In cm",
                  example: 100000,
                },
                totalBlocksMined: { type: "integer", example: 2500 },
              },
            },
            rawStats: {
              type: "object",
              description: "Raw Minecraft statistics data",
            },
          },
        },
        Inventory: {
          type: "object",
          properties: {
            uuid: {
              type: "string",
              format: "uuid",
              description: "Player UUID",
            },
            inventory: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  Slot: { type: "integer" },
                  id: { type: "string", example: "minecraft:diamond_sword" },
                  Count: { type: "integer" },
                  tag: { type: "object" },
                },
              },
            },
            armor: {
              type: "array",
              items: { type: "object" },
            },
            enderChest: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
        WorldInfo: {
          type: "object",
          properties: {
            uploadedAt: {
              type: "string",
              format: "date-time",
              description: "World upload timestamp",
            },
            files: {
              type: "object",
              properties: {
                stats: { type: "integer", description: "Number of stat files" },
                playerdata: {
                  type: "integer",
                  description: "Number of playerdata files",
                },
              },
            },
            size: {
              type: "integer",
              description: "Total size in bytes",
              example: 1048576,
            },
          },
        },
        StorageInfo: {
          type: "object",
          properties: {
            used: {
              type: "object",
              properties: {
                bytes: { type: "integer", example: 1048576 },
                readable: { type: "string", example: "1.00 MB" },
              },
            },
            quota: {
              type: "object",
              properties: {
                bytes: { type: "integer", example: 104857600 },
                readable: { type: "string", example: "100.00 MB" },
              },
            },
            usage: {
              type: "object",
              properties: {
                percentage: { type: "number", example: 1.0 },
                remaining: { type: "string", example: "99.00 MB" },
              },
            },
            files: {
              type: "object",
              properties: {
                count: { type: "integer", example: 5 },
                limit: { type: "integer", example: 1000 },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Error message",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Authentication failed - invalid or missing API key",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                error: "Invalid or missing API key",
              },
            },
          },
        },
        Forbidden: {
          description: "Access forbidden - admin privileges required",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                error: "Access denied",
              },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                error: "Resource not found",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation error - invalid input data",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                error: "userId is required",
              },
            },
          },
        },
        RateLimitExceeded: {
          description: "Rate limit exceeded",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string" },
                  retryAfter: { type: "string", format: "date-time" },
                },
              },
              example: {
                success: false,
                error:
                  "Too many requests from this IP, please try again later.",
                retryAfter: "2025-10-26T12:30:00Z",
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Health",
        description: "API health check endpoints",
      },
      {
        name: "Admin",
        description:
          "User management and administrative operations (requires admin key)",
      },
      {
        name: "World",
        description: "World upload and management endpoints",
      },
      {
        name: "Players",
        description: "Player statistics and inventory endpoints",
      },
      {
        name: "Mojang",
        description: "Mojang API proxy endpoints",
      },
      {
        name: "Cache",
        description: "Cache management endpoints",
      },
    ],
  },
  apis: [], // No need to scan files - using centralized paths
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
