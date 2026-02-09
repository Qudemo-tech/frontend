/**
 * PersonaAdapter - Backwards-compatible adapter wrapping DataLoader with legacy persona API
 *
 * This adapter provides the exact same API as basePersona.js, allowing gradual migration
 * from hardcoded persona configs to DataLoader without requiring changes to TavusAvatarWidget.
 *
 * Usage:
 *   // Instead of:
 *   import { getPersona } from '../personas';
 *   const persona = getPersona(personaId);
 *
 *   // Use:
 *   import { PersonaAdapter } from '../dataloader/PersonaAdapter';
 *   const persona = new PersonaAdapter(personaId);
 *
 * The adapter:
 * - Maps persona IDs to course IDs
 * - Provides all methods from basePersona.js (hasFeature, getModule, etc.)
 * - Uses DataLoader internally for content retrieval
 * - Supports lazy loading of course data via getters
 */

import { DataLoader } from './index';

/**
 * Mapping of Tavus persona IDs to course IDs.
 * This allows the adapter to resolve which course data to load
 * based on the persona ID used in the existing codebase.
 *
 * @type {Object.<string, string>}
 */
const PERSONA_TO_COURSE = {
  // Entri onboarding persona
  'p54ceeb77022': 'entri',

  // Qatar conversational persona
  'pf5e3d8bef4a': 'qatar',

  // Evolution learning persona
  'p99b6eb28083': 'evolution',
};

/**
 * Reverse mapping from course ID to persona ID.
 * Useful when creating adapter from course ID directly.
 *
 * @type {Object.<string, string>}
 */
const COURSE_TO_PERSONA = Object.fromEntries(
  Object.entries(PERSONA_TO_COURSE).map(([k, v]) => [v, k])
);

/**
 * Default feature flags matching basePersona.js defaults.
 * All features disabled by default for safety.
 *
 * @type {Object}
 */
const DEFAULT_FEATURES = {
  // Learning/onboarding features
  learningModules: false,
  moduleConfirmation: false,
  proactiveModuleFlow: false,

  // Quiz features
  mcqQuiz: false,
  finalQuiz: false,

  // Media features
  founderVideo: false,
  demoVideos: false,
  pdfViewer: false,
  calendlyIntegration: false,

  // UI features
  modulesSidebar: false,
  debugPanel: false,

  // Behavior features
  speechLock: false,
  visibilityTimeout: false,
};

/**
 * Default UI configuration matching basePersona.js defaults.
 *
 * @type {Object}
 */
const DEFAULT_UI = {
  sidebarWidth: 320,
  theme: 'default',
};

/**
 * PersonaAdapter wraps DataLoader with the legacy persona API.
 *
 * Provides backwards compatibility for existing code that expects
 * the persona object structure from basePersona.js.
 */
export class PersonaAdapter {
  /**
   * Create a new PersonaAdapter.
   *
   * @param {string} personaId - The Tavus persona ID (e.g., 'p54ceeb77022')
   * @param {Object} [options] - Configuration options
   * @param {DataLoader} [options.dataLoader] - Custom DataLoader instance (for testing)
   */
  constructor(personaId, options = {}) {
    this._personaId = personaId;
    this._courseId = this._resolveCourseId(personaId);
    this._dataLoader = options.dataLoader || DataLoader.getInstance();

    // Cached data - loaded lazily
    this._course = null;
    this._modules = null;
    this._quizzes = null;
    this._prompts = null;
  }

  /**
   * Resolve course ID from persona ID.
   * Falls back to using personaId as courseId if no mapping exists.
   *
   * @private
   * @param {string} personaId - The persona ID
   * @returns {string} The resolved course ID
   */
  _resolveCourseId(personaId) {
    // Check direct persona mapping
    if (PERSONA_TO_COURSE[personaId]) {
      return PERSONA_TO_COURSE[personaId];
    }

    // Check if it's already a course ID
    if (COURSE_TO_PERSONA[personaId]) {
      return personaId;
    }

    // Fallback: treat persona ID as course ID
    console.warn(`[PersonaAdapter] Unknown persona ID: ${personaId}, using as course ID`);
    return personaId;
  }

  /**
   * Get the course data, loading lazily if needed.
   *
   * @private
   * @returns {Object|null} The course manifest
   */
  _getCourse() {
    if (this._course === null) {
      this._course = this._dataLoader.getCourse(this._courseId) || {};
    }
    return this._course;
  }

  // ============================================
  // Identity getters (matching basePersona.js)
  // ============================================

  /**
   * Get the persona ID.
   * @returns {string} The persona ID
   */
  get id() {
    return this._personaId;
  }

  /**
   * Get the course ID.
   * @returns {string} The course ID
   */
  get courseId() {
    return this._courseId;
  }

  /**
   * Get the persona/course name.
   * @returns {string} The name from course manifest or 'Unknown'
   */
  get name() {
    const course = this._getCourse();
    return course.avatar?.name || course.meta?.title || 'Unknown';
  }

  /**
   * Get the persona/course description.
   * @returns {string} The description from course manifest or empty string
   */
  get description() {
    const course = this._getCourse();
    return course.meta?.description || '';
  }

  // ============================================
  // Features (matching basePersona.js)
  // ============================================

  /**
   * Get all feature flags.
   * Merges course features with defaults.
   *
   * @returns {Object} Feature flags object
   */
  get features() {
    const course = this._getCourse();
    return {
      ...DEFAULT_FEATURES,
      ...(course.features || {}),
    };
  }

  /**
   * Check if a feature is enabled.
   *
   * @param {string} featureName - The feature name to check
   * @returns {boolean} True if feature is enabled
   */
  hasFeature(featureName) {
    return this.features[featureName] ?? false;
  }

  // ============================================
  // Modules (matching basePersona.js)
  // ============================================

  /**
   * Get modules configuration.
   * Returns object with order, definitions, requiresConfirmation.
   *
   * @returns {Object} Modules configuration
   */
  get modules() {
    if (this._modules === null) {
      const course = this._getCourse();
      const allModules = this._dataLoader.getAllModules(this._courseId) || {};

      // Transform sections from JSON format to courseStructure format
      // JSON has { modules: [...] }, courseStructure expects { items: [...] }
      const courseStructure = (course.structure?.sections || []).map(section => ({
        id: section.id,
        title: section.title,
        items: section.modules || [],
      }));

      // Course metadata for sidebar header
      const courseMeta = {
        title: course.meta?.title || 'Course',
        description: course.meta?.description || '',
      };

      this._modules = {
        order: course.structure?.moduleOrder || [],
        definitions: allModules,
        requiresConfirmation: course.structure?.modulesRequiringConfirmation || [],
        sectionEndingModules: course.structure?.sectionEndingModules || [],
        courseStructure,
        courseMeta,
      };
    }
    return this._modules;
  }

  /**
   * Get a module by ID.
   *
   * @param {string} moduleId - The module ID
   * @returns {Object|null} The module definition or null
   */
  getModule(moduleId) {
    return this.modules.definitions[moduleId] || null;
  }

  /**
   * Get the next module after the current one.
   *
   * @param {string} currentModuleId - The current module ID
   * @returns {string|null} The next module ID or null if at end
   */
  getNextModule(currentModuleId) {
    const order = this.modules.order;
    const currentIndex = order.indexOf(currentModuleId);
    if (currentIndex >= 0 && currentIndex < order.length - 1) {
      return order[currentIndex + 1];
    }
    return null;
  }

  /**
   * Check if a module requires confirmation before advancing.
   *
   * @param {string} moduleId - The module ID
   * @returns {boolean} True if confirmation required
   */
  requiresConfirmation(moduleId) {
    return this.modules.requiresConfirmation.includes(moduleId);
  }

  /**
   * Check if a module is unlocked.
   * Default implementation: all modules are unlocked.
   *
   * @param {string} moduleId - The module ID
   * @param {string[]} [completedModules=[]] - Array of completed module IDs
   * @returns {boolean} True if module is unlocked
   */
  isModuleUnlocked(moduleId, completedModules = []) {
    // Default behavior: all modules unlocked
    // Course-specific unlock logic can be added via course manifest
    const course = this._getCourse();

    // If course has custom unlock logic, respect it
    if (course.structure?.moduleUnlockRules) {
      const rule = course.structure.moduleUnlockRules[moduleId];
      if (rule && rule.requires) {
        // Check if all required modules are completed
        return rule.requires.every((reqId) => completedModules.includes(reqId));
      }
    }

    return true;
  }

  // ============================================
  // Prompts (matching basePersona.js)
  // ============================================

  /**
   * Get prompts configuration.
   * Returns object with welcome and modulePrompts.
   *
   * @returns {Object} Prompts configuration
   */
  get prompts() {
    if (this._prompts === null) {
      const course = this._getCourse();
      const modulePrompts = {};

      // Load prompts for each module
      for (const moduleId of this.modules.order) {
        const prompt = this._dataLoader.getModulePrompt(this._courseId, moduleId);
        if (prompt) {
          modulePrompts[moduleId] = prompt;
        }
      }

      this._prompts = {
        welcome: course.avatar?.welcomeMessage || null,
        modulePrompts,
      };
    }
    return this._prompts;
  }

  /**
   * Get prompt for a specific module.
   *
   * @param {string} moduleId - The module ID
   * @returns {Object|null} The module prompt or null
   */
  getModulePrompt(moduleId) {
    return this.prompts.modulePrompts[moduleId] || null;
  }

  // ============================================
  // Quizzes (matching basePersona.js)
  // ============================================

  /**
   * Get quizzes configuration.
   * Returns object with moduleQuizzes and finalQuiz.
   *
   * @returns {Object} Quizzes configuration
   */
  get quizzes() {
    if (this._quizzes === null) {
      const course = this._getCourse();
      const allQuizzes = this._dataLoader.getAllQuizzes(this._courseId) || {};
      const moduleQuizzes = {};

      // Map quizzes by their ID (e.g., 'founder-video-quiz')
      // This matches legacy persona structure where moduleQuizzes is keyed by quiz module ID
      for (const [quizId, quiz] of Object.entries(allQuizzes)) {
        moduleQuizzes[quizId] = quiz;
      }

      this._quizzes = {
        moduleQuizzes,
        finalQuiz: course.structure?.finalQuizId ? allQuizzes[course.structure.finalQuizId] : null,
      };
    }
    return this._quizzes;
  }

  /**
   * Get quiz for a specific module.
   *
   * @param {string} moduleId - The module ID
   * @returns {Object|null} The quiz definition or null
   */
  getModuleQuiz(moduleId) {
    return this.quizzes.moduleQuizzes[moduleId] || null;
  }

  /**
   * Check if a module has a quiz.
   *
   * @param {string} moduleId - The module ID
   * @returns {boolean} True if module has a quiz
   */
  hasModuleQuiz(moduleId) {
    return !!this.quizzes.moduleQuizzes[moduleId];
  }

  // ============================================
  // UI (matching basePersona.js)
  // ============================================

  /**
   * Get UI configuration.
   *
   * @returns {Object} UI configuration with sidebarWidth, theme
   */
  get ui() {
    const course = this._getCourse();
    return {
      ...DEFAULT_UI,
      ...(course.ui || {}),
    };
  }

  // ============================================
  // Presentations (for modules with slides)
  // ============================================

  /**
   * Get presentation slides for a module.
   * Presentation IDs match the module's presentationRef without the path prefix.
   * E.g., module has presentationRef: "presentations/functions-at-entri.json"
   *       Call: getPresentation('functions-at-entri')
   *
   * @param {string} presentationId - The presentation ID (e.g., 'functions-at-entri')
   * @returns {Object|null} Presentation object with slides array, or null if not found
   */
  getPresentation(presentationId) {
    return this._dataLoader.getPresentation(this._courseId, presentationId);
  }

  /**
   * Check if a presentation exists.
   *
   * @param {string} presentationId - The presentation ID
   * @returns {boolean} True if presentation exists
   */
  hasPresentation(presentationId) {
    return !!this.getPresentation(presentationId);
  }

  // ============================================
  // Static factory methods
  // ============================================

  /**
   * Create PersonaAdapter from persona ID.
   *
   * @param {string} personaId - The Tavus persona ID
   * @param {Object} [options] - Configuration options
   * @returns {PersonaAdapter} New adapter instance
   */
  static fromPersonaId(personaId, options = {}) {
    return new PersonaAdapter(personaId, options);
  }

  /**
   * Create PersonaAdapter from course ID.
   *
   * @param {string} courseId - The course ID
   * @param {Object} [options] - Configuration options
   * @returns {PersonaAdapter} New adapter instance
   */
  static fromCourseId(courseId, options = {}) {
    const personaId = COURSE_TO_PERSONA[courseId] || courseId;
    return new PersonaAdapter(personaId, options);
  }

  /**
   * Get all known persona IDs.
   *
   * @returns {string[]} Array of persona IDs
   */
  static getAllPersonaIds() {
    return Object.keys(PERSONA_TO_COURSE);
  }

  /**
   * Get all known course IDs.
   *
   * @returns {string[]} Array of course IDs
   */
  static getAllCourseIds() {
    return Object.values(PERSONA_TO_COURSE);
  }

  /**
   * Check if a persona ID is known.
   *
   * @param {string} personaId - The persona ID to check
   * @returns {boolean} True if persona ID is known
   */
  static isKnownPersona(personaId) {
    return personaId in PERSONA_TO_COURSE;
  }

  /**
   * Get course ID for a persona ID.
   *
   * @param {string} personaId - The persona ID
   * @returns {string|null} The course ID or null if not found
   */
  static getCourseId(personaId) {
    return PERSONA_TO_COURSE[personaId] || null;
  }

  /**
   * Get persona ID for a course ID.
   *
   * @param {string} courseId - The course ID
   * @returns {string|null} The persona ID or null if not found
   */
  static getPersonaId(courseId) {
    return COURSE_TO_PERSONA[courseId] || null;
  }
}

export default PersonaAdapter;
