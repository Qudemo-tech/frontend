/**
 * Evolution Persona Configuration
 *
 * Configuration for the Evolution learning avatar.
 * Has learning modules but no MCQ quizzes or confirmation pauses.
 *
 * Persona ID: p99b6eb28083
 */

import { createPersona } from '../basePersona';
import modules from './modules';

const evolutionPersona = createPersona({
  // Identification
  id: 'p99b6eb28083',
  name: 'Evolution',
  description: 'Evolution learning avatar',

  // Feature flags - enable learning modules but not MCQ quiz
  features: {
    // Learning/onboarding features
    learningModules: true,
    moduleConfirmation: false,  // No confirmation pauses
    proactiveModuleFlow: false, // User-driven navigation

    // Quiz features
    mcqQuiz: false,  // No MCQ quizzes
    finalQuiz: true, // Has final quiz (conversation-based)

    // Media features
    founderVideo: false,
    demoVideos: false,
    pdfViewer: false,
    calendlyIntegration: false,

    // UI features
    modulesSidebar: true,
    debugPanel: false,

    // Behavior features
    speechLock: false,
    visibilityTimeout: false,
  },

  // Module configuration
  modules: {
    order: modules.order,
    definitions: modules.definitions,
    requiresConfirmation: [],
  },

  // Prompts/scripts
  prompts: {
    welcome: "Hello! I'm here to teach you about evolution. Select a topic from the sidebar to begin!",
    modulePrompts: modules.prompts,
  },

  // UI customization
  ui: {
    sidebarWidth: 320,
    theme: 'evolution',
  },
});

export default evolutionPersona;
