/**
 * PathValidator
 *
 * Prevents path traversal attacks by validating IDs and paths.
 * Ensures all content IDs follow safe patterns and cannot be used
 * to access files outside the intended content directories.
 */

/**
 * Custom error class for security-related failures
 */
export class SecurityError extends Error {
  /**
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Path validator for preventing path traversal attacks
 */
export class PathValidator {
  /**
   * Pattern for safe IDs: alphanumeric, hyphens, underscores only
   * Matches: course-1, module_intro, quiz123
   * Rejects: ../etc, path/to/file, file.json
   */
  static SAFE_ID_PATTERN = /^[a-z0-9_-]+$/i;

  /**
   * Validate an ID is safe to use in paths
   * @param {string} id - ID to validate
   * @param {string} type - Type label for error messages
   * @returns {string} The validated ID
   * @throws {SecurityError} If ID is invalid or contains path traversal
   */
  static validateId(id, type) {
    // Must be a string
    if (typeof id !== 'string') {
      throw new SecurityError(`${type} ID must be a string, got ${typeof id}`);
    }

    // Must not be empty
    if (id.length === 0) {
      throw new SecurityError(`${type} ID cannot be empty`);
    }

    // Must not be too long (prevent DoS via long strings)
    if (id.length > 128) {
      throw new SecurityError(`${type} ID exceeds maximum length of 128 characters`);
    }

    // Check for path traversal patterns
    if (id.includes('..')) {
      throw new SecurityError(`Path traversal attempt detected in ${type} ID: ${id}`);
    }

    if (id.includes('/')) {
      throw new SecurityError(`Path separator (/) not allowed in ${type} ID: ${id}`);
    }

    if (id.includes('\\')) {
      throw new SecurityError(`Path separator (\\) not allowed in ${type} ID: ${id}`);
    }

    // Must match safe pattern
    if (!this.SAFE_ID_PATTERN.test(id)) {
      throw new SecurityError(
        `Invalid ${type} ID: "${id}". Only alphanumeric characters, hyphens, and underscores are allowed`
      );
    }

    return id;
  }

  /**
   * Validate a course ID
   * @param {string} courseId - Course ID to validate
   * @returns {string} The validated ID
   * @throws {SecurityError} If invalid
   */
  static validateCourseId(courseId) {
    return this.validateId(courseId, 'course');
  }

  /**
   * Validate a module ID
   * @param {string} moduleId - Module ID to validate
   * @returns {string} The validated ID
   * @throws {SecurityError} If invalid
   */
  static validateModuleId(moduleId) {
    return this.validateId(moduleId, 'module');
  }

  /**
   * Validate a quiz ID
   * @param {string} quizId - Quiz ID to validate
   * @returns {string} The validated ID
   * @throws {SecurityError} If invalid
   */
  static validateQuizId(quizId) {
    return this.validateId(quizId, 'quiz');
  }

  /**
   * Validate a presentation ID
   * @param {string} presentationId - Presentation ID to validate
   * @returns {string} The validated ID
   * @throws {SecurityError} If invalid
   */
  static validatePresentationId(presentationId) {
    return this.validateId(presentationId, 'presentation');
  }

  /**
   * Check if an ID is valid without throwing
   * @param {string} id - ID to check
   * @returns {boolean} True if valid
   */
  static isValidId(id) {
    try {
      this.validateId(id, 'id');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize an ID by removing unsafe characters (use with caution)
   * @param {string} id - ID to sanitize
   * @returns {string} Sanitized ID
   */
  static sanitizeId(id) {
    if (typeof id !== 'string') {
      return '';
    }

    // Remove all characters except alphanumeric, hyphens, underscores
    return id.replace(/[^a-z0-9_-]/gi, '').substring(0, 128);
  }
}

export default PathValidator;
