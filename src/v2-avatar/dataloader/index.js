/**
 * DataLoader - Central content access point for course data
 *
 * Provides a unified API for loading course content from various sources.
 * Currently supports BundleSource (static imports), with RemoteSource planned for Phase 4.
 *
 * Features:
 * - Pluggable source architecture (bundle, remote)
 * - In-memory caching
 * - Request deduplication (for async sources)
 * - Placeholder hooks for validation/sanitization (Plan 03)
 */

import { BundleSource } from './sources/BundleSource';

/**
 * Default configuration for DataLoader
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  source: 'bundle', // 'bundle' | 'remote' (remote in Phase 4)
  validateSchema: true,
  sanitizeContent: true,
  cacheEnabled: true,
};

/**
 * Generate a cache key for content requests
 * @param {string} type - Content type (course, module, quiz, presentation, prompt)
 * @param {string} courseId - Course identifier
 * @param {string} [contentId] - Optional content identifier
 * @param {string} [subKey] - Optional sub-key (e.g., prompt type)
 * @returns {string} Cache key
 */
function getCacheKey(type, courseId, contentId, subKey) {
  const parts = [type, courseId];
  if (contentId) parts.push(contentId);
  if (subKey) parts.push(subKey);
  return parts.join(':');
}

/**
 * DataLoader provides centralized access to course content.
 *
 * Supports multiple content sources and provides caching, deduplication,
 * and future hooks for validation and sanitization.
 */
export class DataLoader {
  /**
   * Create a new DataLoader instance.
   * @param {Object} [config] - Configuration options
   * @param {string} [config.source='bundle'] - Content source type ('bundle' or 'remote')
   * @param {boolean} [config.validateSchema=true] - Enable schema validation (Plan 03)
   * @param {boolean} [config.sanitizeContent=true] - Enable content sanitization (Plan 03)
   * @param {boolean} [config.cacheEnabled=true] - Enable in-memory caching
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize the appropriate source
    this._initSource();

    // In-memory cache for content
    this.cache = new Map();

    // Track in-flight requests for deduplication (for async sources)
    // For bundle source this is not needed since it's sync, but structure
    // is important for future remote source support
    this.inFlight = new Map();
  }

  /**
   * Initialize the content source based on configuration.
   * @private
   */
  _initSource() {
    switch (this.config.source) {
      case 'bundle':
        this.source = new BundleSource();
        break;
      case 'remote':
        // TODO: Phase 4 - Initialize RemoteSource
        // this.source = new RemoteSource(this.config.remoteConfig);
        throw new Error('Remote source not yet implemented (Phase 4)');
      default:
        throw new Error(`Unknown source type: ${this.config.source}`);
    }
  }

  /**
   * Get content from cache or source, with caching support.
   * @private
   * @param {string} cacheKey - Cache key
   * @param {Function} fetchFn - Function to fetch content if not cached
   * @returns {*} The content or null
   */
  _getWithCache(cacheKey, fetchFn) {
    // Check cache first
    if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Fetch from source
    const content = fetchFn();

    // Process through validation/sanitization hooks
    const processed = this._processContent(content);

    // Cache the result (including null for negative caching)
    if (this.config.cacheEnabled) {
      this.cache.set(cacheKey, processed);
    }

    return processed;
  }

  /**
   * Process content through validation and sanitization hooks.
   * @private
   * @param {*} content - Raw content from source
   * @returns {*} Processed content
   */
  _processContent(content) {
    if (content === null) {
      return null;
    }

    // TODO: Plan 03 - validate with SchemaValidator
    if (this.config.validateSchema) {
      // Validation will be implemented in Plan 03
      // const errors = SchemaValidator.validate(content);
      // if (errors.length > 0) { ... }
    }

    // TODO: Plan 03 - sanitize with ContentSanitizer
    if (this.config.sanitizeContent) {
      // Sanitization will be implemented in Plan 03
      // content = ContentSanitizer.sanitize(content);
    }

    return content;
  }

  /**
   * Get the course manifest for a given course ID.
   * @param {string} courseId - The unique identifier of the course
   * @returns {Object|null} The course manifest object, or null if not found
   */
  getCourse(courseId) {
    const cacheKey = getCacheKey('course', courseId);
    return this._getWithCache(cacheKey, () => this.source.getCourse(courseId));
  }

  /**
   * Get a module definition by course and module ID.
   * @param {string} courseId - The unique identifier of the course
   * @param {string} moduleId - The unique identifier of the module
   * @returns {Object|null} The module definition object, or null if not found
   */
  getModule(courseId, moduleId) {
    const cacheKey = getCacheKey('module', courseId, moduleId);
    return this._getWithCache(cacheKey, () => this.source.getModule(courseId, moduleId));
  }

  /**
   * Get a quiz definition by course and quiz ID.
   * @param {string} courseId - The unique identifier of the course
   * @param {string} quizId - The unique identifier of the quiz
   * @returns {Object|null} The quiz definition object, or null if not found
   */
  getQuiz(courseId, quizId) {
    const cacheKey = getCacheKey('quiz', courseId, quizId);
    return this._getWithCache(cacheKey, () => this.source.getQuiz(courseId, quizId));
  }

  /**
   * Get a presentation by course and presentation ID.
   * @param {string} courseId - The unique identifier of the course
   * @param {string} presentationId - The unique identifier of the presentation
   * @returns {Object|null} The presentation object, or null if not found
   */
  getPresentation(courseId, presentationId) {
    const cacheKey = getCacheKey('presentation', courseId, presentationId);
    return this._getWithCache(cacheKey, () =>
      this.source.getPresentation(courseId, presentationId)
    );
  }

  /**
   * Get a specific prompt for a module.
   * @param {string} courseId - The unique identifier of the course
   * @param {string} moduleId - The unique identifier of the module
   * @param {string} [promptType] - Optional prompt type (e.g., 'intro', 'outro', 'completion')
   * @returns {Object|string|null} The prompts object, specific prompt string, or null if not found
   */
  getModulePrompt(courseId, moduleId, promptType) {
    const cacheKey = getCacheKey('prompt', courseId, moduleId, promptType);
    return this._getWithCache(cacheKey, () =>
      this.source.getModulePrompt(courseId, moduleId, promptType)
    );
  }

  /**
   * Check if a course is available.
   * @param {string} courseId - The unique identifier of the course
   * @returns {boolean} True if the course exists
   */
  hasCourse(courseId) {
    return this.source.hasCourse(courseId);
  }

  /**
   * Get a list of all available course IDs.
   * @returns {string[]} Array of available course IDs
   */
  getAvailableCourses() {
    return this.source.getAvailableCourses();
  }

  /**
   * Get all modules for a course.
   * @param {string} courseId - The unique identifier of the course
   * @returns {Object|null} Object containing all module definitions, or null if course not found
   */
  getAllModules(courseId) {
    const cacheKey = getCacheKey('modules-all', courseId);
    return this._getWithCache(cacheKey, () => this.source.getAllModules(courseId));
  }

  /**
   * Get all quizzes for a course.
   * @param {string} courseId - The unique identifier of the course
   * @returns {Object|null} Object containing all quiz definitions, or null if course not found
   */
  getAllQuizzes(courseId) {
    const cacheKey = getCacheKey('quizzes-all', courseId);
    return this._getWithCache(cacheKey, () => this.source.getAllQuizzes(courseId));
  }

  /**
   * Clear the cache.
   * @param {string} [courseId] - Optional course ID to clear specific course cache
   */
  clearCache(courseId) {
    if (courseId) {
      // Clear all entries for a specific course
      for (const key of this.cache.keys()) {
        if (key.includes(`:${courseId}:`) || key.endsWith(`:${courseId}`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear entire cache
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics for debugging.
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // ============================================
  // Static factory methods for testing
  // ============================================

  /**
   * Create a new DataLoader instance with custom configuration.
   * Useful for testing with different configurations.
   * @param {Object} [config] - Configuration options
   * @returns {DataLoader} New DataLoader instance
   */
  static create(config = {}) {
    return new DataLoader(config);
  }

  /**
   * Reset the singleton instance.
   * Useful for testing to ensure clean state.
   */
  static reset() {
    if (singletonInstance) {
      singletonInstance.clearCache();
      singletonInstance = null;
    }
  }

  /**
   * Get the singleton instance, creating it if necessary.
   * @returns {DataLoader} The singleton DataLoader instance
   */
  static getInstance() {
    if (!singletonInstance) {
      singletonInstance = new DataLoader();
    }
    return singletonInstance;
  }
}

// Singleton instance
let singletonInstance = null;

/**
 * Default singleton DataLoader instance.
 * Use this for app-wide content access.
 * @type {DataLoader}
 */
export const dataLoader = DataLoader.getInstance();

export default DataLoader;
