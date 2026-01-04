/**
 * Base Persona Configuration
 *
 * All personas inherit from this base config.
 * Override only what you need in individual persona configs.
 *
 * This ensures new personas have safe defaults and don't
 * accidentally enable features meant for other personas.
 */

const basePersona = {
  // Persona identification
  id: null,
  name: 'Default',
  description: 'Base persona with default behavior',

  // Feature flags - all disabled by default
  features: {
    // Learning/onboarding features
    learningModules: false,        // Show learning modules sidebar
    moduleConfirmation: false,     // Pause between modules for user confirmation
    proactiveModuleFlow: false,    // Auto-advance through modules

    // Quiz features
    mcqQuiz: false,                // Enable MCQ quizzes after modules
    finalQuiz: false,              // Enable final assessment quiz

    // Media features
    founderVideo: false,           // Show founder/intro video
    demoVideos: false,             // Allow demo video playback
    pdfViewer: false,              // Allow PDF viewing
    calendlyIntegration: false,    // Allow Calendly scheduling

    // UI features
    modulesSidebar: false,         // Show modules sidebar
    debugPanel: false,             // Show debug panel

    // Behavior features
    speechLock: false,             // Lock user input during module speech
    visibilityTimeout: false,      // Timeout after being hidden
  },

  // Module configuration (empty by default)
  modules: {
    order: [],                     // Array of module IDs in order
    definitions: {},               // Module definitions keyed by ID
    requiresConfirmation: [],      // Modules that need user confirmation
  },

  // Quiz configuration (empty by default)
  quizzes: {
    moduleQuizzes: {},             // Quizzes per module
    finalQuiz: null,               // Final assessment quiz
  },

  // Prompts/scripts (empty by default)
  prompts: {
    welcome: null,
    modulePrompts: {},             // Prompts keyed by module ID
  },

  // UI customization
  ui: {
    sidebarWidth: 320,
    theme: 'default',
  },

  // Methods (can be overridden)

  /**
   * Check if a feature is enabled
   */
  hasFeature(featureName) {
    return this.features[featureName] ?? false;
  },

  /**
   * Get module by ID
   */
  getModule(moduleId) {
    return this.modules.definitions[moduleId] || null;
  },

  /**
   * Get quiz for a module
   */
  getModuleQuiz(moduleId) {
    return this.quizzes.moduleQuizzes[moduleId] || null;
  },

  /**
   * Check if module has a quiz
   */
  hasModuleQuiz(moduleId) {
    return !!this.quizzes.moduleQuizzes[moduleId];
  },

  /**
   * Get prompt for a module
   */
  getModulePrompt(moduleId) {
    return this.prompts.modulePrompts[moduleId] || null;
  },

  /**
   * Check if module requires confirmation before advancing
   */
  requiresConfirmation(moduleId) {
    return this.modules.requiresConfirmation.includes(moduleId);
  },

  /**
   * Get next module after current one
   */
  getNextModule(currentModuleId) {
    const order = this.modules.order;
    const currentIndex = order.indexOf(currentModuleId);
    if (currentIndex >= 0 && currentIndex < order.length - 1) {
      return order[currentIndex + 1];
    }
    return null;
  },

  /**
   * Check if module is unlocked (default: all unlocked)
   */
  isModuleUnlocked(moduleId, completedModules = []) {
    return true;
  },
};

/**
 * Create a new persona config by merging with base
 * Deep merges features, modules, quizzes, prompts, and ui
 */
export const createPersona = (config) => {
  const persona = {
    ...basePersona,
    ...config,
    features: {
      ...basePersona.features,
      ...(config.features || {}),
    },
    modules: {
      ...basePersona.modules,
      ...(config.modules || {}),
    },
    quizzes: {
      ...basePersona.quizzes,
      ...(config.quizzes || {}),
    },
    prompts: {
      ...basePersona.prompts,
      ...(config.prompts || {}),
    },
    ui: {
      ...basePersona.ui,
      ...(config.ui || {}),
    },
  };

  // Bind methods to the new persona object (arrow functions to preserve `this`)
  persona.hasFeature = (featureName) => persona.features[featureName] ?? false;
  persona.getModule = (moduleId) => persona.modules.definitions[moduleId] || null;
  persona.getModuleQuiz = (moduleId) => persona.quizzes.moduleQuizzes[moduleId] || null;
  persona.hasModuleQuiz = (moduleId) => !!persona.quizzes.moduleQuizzes[moduleId];
  persona.getModulePrompt = (moduleId) => persona.prompts.modulePrompts[moduleId] || null;
  persona.requiresConfirmation = (moduleId) => persona.modules.requiresConfirmation.includes(moduleId);
  persona.getNextModule = (currentModuleId) => {
    const order = persona.modules.order;
    const currentIndex = order.indexOf(currentModuleId);
    if (currentIndex >= 0 && currentIndex < order.length - 1) {
      return order[currentIndex + 1];
    }
    return null;
  };
  persona.isModuleUnlocked = config.isModuleUnlocked
    ? (moduleId, completedModules) => config.isModuleUnlocked.call(persona, moduleId, completedModules)
    : () => true;

  return persona;
};

export default basePersona;
