/**
 * BundleSource - Provides content from statically imported course bundles
 *
 * This source uses static imports that get tree-shaken at build time,
 * ensuring only the bundles actually used are included in the final build.
 *
 * Bundle structure (flat at root level):
 * {
 *   id: 'course-id',
 *   meta: { ... course metadata ... },
 *   avatar: { ... avatar config ... },
 *   features: { ... feature flags ... },
 *   structure: { ... sections, moduleOrder ... },
 *   modules: { moduleId: { ... module definition ... } },
 *   quizzes: { quizId: { ... quiz definition ... } },
 *   presentations: { presentationId: { ... presentation ... } },
 *   prompts: { moduleId: { ... prompt variants ... } }
 * }
 */

// Static imports for bundling (tree-shakeable)
import entriBundle from '../../data/courses/entri.json';
import qatarBundle from '../../data/courses/qatar.json';
import evolutionBundle from '../../data/courses/evolution.json';

/**
 * Map of course IDs to their bundled content.
 * @type {Object.<string, Object>}
 */
const COURSE_BUNDLES = {
  entri: entriBundle,
  qatar: qatarBundle,
  evolution: evolutionBundle,
};

/**
 * BundleSource provides synchronous access to statically imported course bundles.
 *
 * All methods are synchronous since bundles are imported at build time.
 * Missing content returns null rather than throwing errors.
 */
export class BundleSource {
  /**
   * Create a new BundleSource instance.
   * @param {Object} [options] - Configuration options
   * @param {Object.<string, Object>} [options.bundles] - Override bundles map (for testing)
   */
  constructor(options = {}) {
    this.bundles = options.bundles || COURSE_BUNDLES;
  }

  /**
   * Get the course manifest for a given course ID.
   * Bundle has flat structure - extract manifest fields from top level.
   * @param {string} courseId - The unique identifier of the course
   * @returns {Object|null} The course manifest object (id, meta, avatar, features, structure), or null if not found
   */
  getCourse(courseId) {
    const bundle = this.bundles[courseId];
    if (!bundle) {
      return null;
    }

    // Bundle has flat structure - extract manifest fields
    const { id, meta, avatar, features, structure } = bundle;
    return { id, meta, avatar, features, structure };
  }

  /**
   * Get a module definition by course and module ID.
   * Returns the module with its associated prompt attached.
   * @param {string} courseId - The unique identifier of the course
   * @param {string} moduleId - The unique identifier of the module
   * @returns {Object|null} The module definition object with prompt attached, or null if not found
   */
  getModule(courseId, moduleId) {
    const bundle = this.bundles[courseId];
    if (!bundle || !bundle.modules) {
      return null;
    }

    const moduleData = bundle.modules[moduleId];
    if (!moduleData) {
      return null;
    }

    // Attach prompt if available
    const prompt = bundle.prompts?.[moduleId] || null;
    if (prompt) {
      return { ...moduleData, prompt };
    }

    return moduleData;
  }

  /**
   * Get a quiz definition by course and quiz ID.
   * @param {string} courseId - The unique identifier of the course
   * @param {string} quizId - The unique identifier of the quiz
   * @returns {Object|null} The quiz definition object, or null if not found
   */
  getQuiz(courseId, quizId) {
    const bundle = this.bundles[courseId];
    if (!bundle || !bundle.quizzes) {
      return null;
    }
    return bundle.quizzes[quizId] || null;
  }

  /**
   * Get a presentation by course and presentation ID.
   * @param {string} courseId - The unique identifier of the course
   * @param {string} presentationId - The unique identifier of the presentation
   * @returns {Object|null} The presentation object, or null if not found
   */
  getPresentation(courseId, presentationId) {
    const bundle = this.bundles[courseId];
    if (!bundle || !bundle.presentations) {
      return null;
    }
    return bundle.presentations[presentationId] || null;
  }

  /**
   * Check if a course bundle is available.
   * @param {string} courseId - The unique identifier of the course
   * @returns {boolean} True if the course bundle exists
   */
  hasCourse(courseId) {
    return Object.prototype.hasOwnProperty.call(this.bundles, courseId);
  }

  /**
   * Get a list of all available course IDs.
   * @returns {string[]} Array of available course IDs
   */
  getAvailableCourses() {
    return Object.keys(this.bundles);
  }

  /**
   * Get prompts for a module by course, module ID, and optional prompt type.
   * @param {string} courseId - The unique identifier of the course
   * @param {string} moduleId - The unique identifier of the module
   * @param {string} [promptType] - Optional prompt type (e.g., 'main', 'completion', 'transition')
   * @returns {Object|string|null} The prompts object, specific prompt string, or null if not found
   */
  getModulePrompt(courseId, moduleId, promptType) {
    const bundle = this.bundles[courseId];
    if (!bundle || !bundle.prompts) {
      return null;
    }

    const modulePrompts = bundle.prompts[moduleId];
    if (!modulePrompts) {
      return null;
    }

    // If promptType specified, return that specific prompt
    if (promptType) {
      return modulePrompts[promptType] || null;
    }

    // Otherwise return the entire prompts object for this module
    return modulePrompts;
  }

  /**
   * Get all modules for a course.
   * @param {string} courseId - The unique identifier of the course
   * @returns {Object|null} Object containing all module definitions, or null if course not found
   */
  getAllModules(courseId) {
    const bundle = this.bundles[courseId];
    if (!bundle || !bundle.modules) {
      return null;
    }
    return bundle.modules;
  }

  /**
   * Get all quizzes for a course.
   * @param {string} courseId - The unique identifier of the course
   * @returns {Object|null} Object containing all quiz definitions, or null if course not found
   */
  getAllQuizzes(courseId) {
    const bundle = this.bundles[courseId];
    if (!bundle || !bundle.quizzes) {
      return null;
    }
    return bundle.quizzes;
  }
}

export default BundleSource;
