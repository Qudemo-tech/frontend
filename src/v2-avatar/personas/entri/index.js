/**
 * Entri Persona Configuration
 *
 * Complete configuration for the Entri onboarding avatar.
 * Persona ID: p54ceeb77022
 */

import { createPersona } from '../basePersona';
import modules from './modules';
import quizzes from './quizzes';
import prompts from './prompts';

const entriPersona = createPersona({
  // Identification
  id: 'p54ceeb77022',
  name: 'Entri',
  description: 'Entri employee onboarding avatar',

  // Feature flags - enable Entri-specific features
  features: {
    // Learning/onboarding features
    learningModules: true,
    moduleConfirmation: true,
    proactiveModuleFlow: true,

    // Quiz features
    mcqQuiz: true,
    finalQuiz: true,

    // Media features
    founderVideo: true,
    demoVideos: true,
    pdfViewer: true,
    calendlyIntegration: true,

    // UI features
    modulesSidebar: true,
    debugPanel: false,

    // Behavior features
    speechLock: true,
    visibilityTimeout: true,
  },

  // Module configuration
  modules: {
    order: modules.order,
    definitions: modules.definitions,
    requiresConfirmation: modules.requiresConfirmation,
  },

  // Quiz configuration
  quizzes: {
    moduleQuizzes: quizzes.moduleQuizzes,
    finalQuiz: quizzes.finalQuiz,
  },

  // Prompts/scripts
  prompts: {
    welcome: prompts.welcomeMessage,
    modulePrompts: prompts.modulePrompts,
  },

  // UI customization
  ui: {
    sidebarWidth: 320,
    theme: 'entri',
  },

  // Custom method: Check if module is unlocked
  isModuleUnlocked(moduleId, completedModules = []) {
    // All Entri modules are unlocked (linear progression handled by flow)
    return true;
  },
});

export default entriPersona;
