/**
 * Qatar History Persona Configuration
 *
 * Complete configuration for the Qatar History Essentials course avatar.
 * Course: Qatar History Essentials: Geography, Leadership, and Modern Nationhood
 */

import { createPersona } from '../basePersona';
import modules from './modules';
import quizzes from './quizzes';
import prompts from './prompts';

const qatarHistoryPersona = createPersona({
  // Identification
  id: 'pc0c4adf1eac',
  name: 'Qatar History Essentials',
  description: 'Qatar history education course',

  // Feature flags - enable Qatar History course features
  features: {
    // Learning/onboarding features
    learningModules: true,
    moduleConfirmation: true,
    proactiveModuleFlow: true,

    // Quiz features
    mcqQuiz: true,
    finalQuiz: true,

    // Media features
    founderVideo: false,
    demoVideos: false,
    pdfViewer: true,
    calendlyIntegration: false,

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
    sectionEndingModules: modules.sectionEndingModules,
    courseStructure: modules.courseStructure,
    courseMeta: modules.courseMeta,
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
    videoCompletionPrompts: prompts.videoCompletionPrompts,
    moduleTransitionPrompts: prompts.moduleTransitionPrompts,
    courseCompletion: prompts.courseCompletionPrompt,
  },

  // UI customization
  ui: {
    sidebarWidth: 320,
    theme: 'qatar_history',
  },

  // Custom method: Check if module is unlocked
  isModuleUnlocked(moduleId, completedModules = []) {
    // All modules are unlocked (linear progression handled by flow)
    return true;
  },
});

export default qatarHistoryPersona;
