/**
 * 5G Persona Configuration
 *
 * Complete configuration for the 5G Essentials course avatar.
 * Course: 5G Essentials: Connecting the Future
 */

import { createPersona } from '../basePersona';
import modules from './modules';
import quizzes from './quizzes';
import prompts from './prompts';

const fiveGPersona = createPersona({
  // Identification
  id: 'p607dc212fc9',  // TODO: Update with valid Tavus persona ID
  name: '5G Essentials',
  description: '5G technology education course',

  // Feature flags - enable 5G course features
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
    demoVideos: true,
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
    courseCompletion: prompts.courseCompletionPrompt,
  },

  // UI customization
  ui: {
    sidebarWidth: 320,
    theme: '5g',
  },

  // Custom method: Check if module is unlocked
  isModuleUnlocked(moduleId, completedModules = []) {
    // All modules are unlocked (linear progression handled by flow)
    return true;
  },
});

export default fiveGPersona;
