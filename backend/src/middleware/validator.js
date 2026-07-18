/**
 * Express Request Schema Validation Middleware
 */
'use strict';

const { BadRequestError } = require('../utils/errors');

/**
 * Validate request body against a schema descriptor.
 * @param {Object} schema - object describing the required fields and types.
 * @returns {Function} Express middleware
 */
function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const val = body[field];

      // Check required
      if (rules.required && (val === undefined || val === null || val === '')) {
        errors.push(`Field "${field}" is required.`);
        continue;
      }

      if (val !== undefined && val !== null) {
        // Check type
        if (rules.type && typeof val !== rules.type) {
          errors.push(`Field "${field}" must be of type "${rules.type}".`);
          continue;
        }

        // Sanitization and size limits for strings
        if (typeof val === 'string') {
          // Check maxLength
          if (rules.maxLength && val.length > rules.maxLength) {
            errors.push(`Field "${field}" must be at most ${rules.maxLength} characters long.`);
          }

          // Check minLength
          if (rules.minLength && val.length < rules.minLength) {
            errors.push(`Field "${field}" must be at least ${rules.minLength} characters long.`);
          }

          // Perform HTML Sanitization
          if (rules.sanitize) {
            req.body[field] = val.replace(/<[^>]*>/g, '');
          }
        }

        // Check format (regex)
        if (rules.regex && typeof val === 'string' && !rules.regex.test(val)) {
          errors.push(`Field "${field}" is invalid.`);
        }
      }
    }

    if (errors.length > 0) {
      return next(new BadRequestError(errors.join(' '), 'VALIDATION_FAILED'));
    }

    next();
  };
}

module.exports = {
  validateBody,
};
