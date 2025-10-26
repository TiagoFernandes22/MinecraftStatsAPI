const Joi = require("joi");

/**
 * Validation schemas for API requests
 */
const schemas = {
  // User creation validation
  createUser: Joi.object({
    userId: Joi.string()
      .pattern(/^[a-zA-Z0-9_.-]+$/)
      .min(3)
      .max(30)
      .required()
      .messages({
        "string.pattern.base":
          "userId must only contain letters, numbers, hyphens, underscores, and periods",
        "string.min": "userId must be at least 3 characters",
        "string.max": "userId must not exceed 30 characters",
        "any.required": "userId is required",
      }),
    displayName: Joi.string().min(1).max(50).required().messages({
      "string.min": "displayName is required",
      "string.max": "displayName must not exceed 50 characters",
      "any.required": "displayName is required",
    }),
  }),

  // User update validation
  updateUser: Joi.object({
    displayName: Joi.string().min(1).max(50).required().messages({
      "string.min": "displayName is required",
      "string.max": "displayName must not exceed 50 characters",
      "any.required": "displayName is required",
    }),
  }),

  // Player filter validation
  hiddenPlayers: Joi.object({
    hiddenPlayers: Joi.array()
      .items(
        Joi.string().uuid().messages({
          "string.uuid": "Each player UUID must be a valid UUID format",
        })
      )
      .required()
      .messages({
        "array.base": "hiddenPlayers must be an array",
        "any.required": "hiddenPlayers is required",
      }),
  }),

  // Filter players by UUID list
  filterPlayers: Joi.object({
    uuids: Joi.array()
      .items(
        Joi.string().uuid().messages({
          "string.uuid": "Each UUID must be a valid UUID format",
        })
      )
      .min(1)
      .required()
      .messages({
        "array.base": "uuids must be an array",
        "array.min": "uuids must contain at least one UUID",
        "any.required": "uuids is required",
      }),
  }),

  // UUID parameter validation
  uuidParam: Joi.object({
    uuid: Joi.string().uuid().required().messages({
      "string.uuid": "Invalid UUID format",
      "any.required": "UUID is required",
    }),
  }),

  // userId parameter validation
  userIdParam: Joi.object({
    userId: Joi.string()
      .pattern(/^[a-zA-Z0-9_.-]+$/)
      .min(3)
      .max(30)
      .required()
      .messages({
        "string.pattern.base":
          "userId must only contain letters, numbers, hyphens, underscores, and periods",
        "string.min": "userId must be at least 3 characters",
        "string.max": "userId must not exceed 30 characters",
        "any.required": "userId is required",
      }),
  }),
};

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema to validate against
 * @param {string} source - Source of data to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: true, // Return only the first error for simpler error messages
      stripUnknown: true, // Remove unknown keys from the validated data
    });

    if (error) {
      // Return simple error message for backward compatibility
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    // Replace request data with validated/sanitized data
    req[source] = value;
    next();
  };
};

module.exports = { validate, schemas };
