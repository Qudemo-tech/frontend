/**
 * SchemaValidator
 *
 * Validates content data against JSON schemas using ajv.
 * Provides three validation modes for different environments:
 * - STRICT: Throw on any error or warning (CI/testing)
 * - NORMAL: Throw on errors, log warnings (development)
 * - PERMISSIVE: Log everything, never throw (production fallback)
 */

import Ajv from 'ajv';
import { schemas } from '../schemas/index.js';

/**
 * Validation mode determines how validation results are handled
 */
export const ValidationMode = {
  /** Throw on any error or warning - for CI/testing */
  STRICT: 'strict',
  /** Throw on errors, log warnings - for development */
  NORMAL: 'normal',
  /** Log everything, never throw - for production fallback */
  PERMISSIVE: 'permissive',
};

/**
 * Custom error class for validation failures
 */
export class ValidationError extends Error {
  /**
   * @param {string} message - Error message
   * @param {Array<Object>} errors - Array of validation error details
   */
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Schema validator using ajv for JSON Schema validation
 */
export class SchemaValidator {
  /**
   * Create a SchemaValidator instance
   * @param {string} mode - ValidationMode value (STRICT, NORMAL, or PERMISSIVE)
   */
  constructor(mode = ValidationMode.NORMAL) {
    this.mode = mode;
    this.ajv = new Ajv({
      allErrors: true, // Report all errors, not just the first
      verbose: true, // Include schema in error reports
      strict: false, // Allow unknown keywords for flexibility
    });

    // Compile all schemas
    this.validators = {};
    for (const [type, schema] of Object.entries(schemas)) {
      try {
        this.validators[type] = this.ajv.compile(schema);
      } catch (error) {
        console.error(`Failed to compile schema for ${type}:`, error.message);
      }
    }
  }

  /**
   * Validate data against a schema
   * @param {string} type - Content type (course, module, quiz, presentation)
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result { valid, errors, warnings }
   */
  validate(type, data) {
    const validator = this.validators[type];

    if (!validator) {
      const result = {
        valid: false,
        errors: [
          {
            field: 'type',
            message: `Unknown content type: ${type}. Expected one of: ${Object.keys(this.validators).join(', ')}`,
            severity: 'error',
          },
        ],
        warnings: [],
      };
      return this.handleResult(type, result);
    }

    const valid = validator(data);
    const errors = valid ? [] : this.formatErrors(validator.errors);

    const result = { valid, errors, warnings: [] };
    return this.handleResult(type, result);
  }

  /**
   * Format ajv errors into a more readable structure
   * @param {Array} ajvErrors - Raw ajv error array
   * @returns {Array<Object>} Formatted error objects
   */
  formatErrors(ajvErrors) {
    return (ajvErrors || []).map((err) => ({
      field: err.instancePath || 'root',
      message: this.buildErrorMessage(err),
      params: err.params,
      severity: 'error',
    }));
  }

  /**
   * Build a human-readable error message from ajv error
   * @param {Object} err - ajv error object
   * @returns {string} Formatted error message
   */
  buildErrorMessage(err) {
    const path = err.instancePath || 'root';

    switch (err.keyword) {
      case 'required':
        return `${path} is missing required property "${err.params.missingProperty}"`;
      case 'type':
        return `${path} ${err.message}`;
      case 'enum':
        return `${path} must be one of: ${err.params.allowedValues.join(', ')}`;
      case 'pattern':
        return `${path} does not match required pattern`;
      case 'minLength':
        return `${path} must have at least ${err.params.limit} characters`;
      case 'maxLength':
        return `${path} must not exceed ${err.params.limit} characters`;
      case 'minimum':
        return `${path} must be >= ${err.params.limit}`;
      case 'maximum':
        return `${path} must be <= ${err.params.limit}`;
      case 'additionalProperties':
        return `${path} has unexpected property "${err.params.additionalProperty}"`;
      default:
        return `${path} ${err.message}`;
    }
  }

  /**
   * Handle validation result based on current mode
   * @param {string} type - Content type being validated
   * @param {Object} result - Validation result { valid, errors, warnings }
   * @returns {Object} The validation result
   * @throws {ValidationError} In STRICT or NORMAL mode when validation fails
   */
  handleResult(type, result) {
    const allIssues = [...result.errors, ...result.warnings];

    switch (this.mode) {
      case ValidationMode.STRICT:
        // Throw on any error or warning
        if (!result.valid || result.warnings.length > 0) {
          throw new ValidationError(
            `Validation failed for ${type}: ${allIssues.length} issue(s) found`,
            allIssues
          );
        }
        break;

      case ValidationMode.NORMAL:
        // Log warnings, throw on errors
        if (result.warnings.length > 0) {
          console.warn(`Validation warnings for ${type}:`, result.warnings);
        }
        if (!result.valid) {
          throw new ValidationError(
            `Validation failed for ${type}: ${result.errors.length} error(s) found`,
            result.errors
          );
        }
        break;

      case ValidationMode.PERMISSIVE:
        // Log everything, never throw
        if (!result.valid || result.warnings.length > 0) {
          console.warn(`Validation issues for ${type}:`, allIssues);
        }
        break;
    }

    return result;
  }

  /**
   * Check if a content type has a registered validator
   * @param {string} type - Content type to check
   * @returns {boolean} True if validator exists
   */
  hasValidator(type) {
    return type in this.validators;
  }

  /**
   * Get list of supported content types
   * @returns {string[]} Array of content type names
   */
  getSupportedTypes() {
    return Object.keys(this.validators);
  }
}

export default SchemaValidator;
