/**
 * Microwave Persona Configuration
 *
 * Complete configuration for the Microwave Technology course avatar.
 * Course: Introduction to Microwaves - Waveguides, Radar, and Satellite Communications
 */

import { createPersona } from '../basePersona';
import modules from './modules';
import quizzes from './quizzes';
import prompts from './prompts';

const microwavePersona = createPersona({
  // Identification
  id: 'p491e1e3a3d2',
  name: 'Microwave Technology',
  description: 'Microwave technology education course',

  // Feature flags - enable Microwave course features
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
    videoCompletionPrompts: prompts.videoCompletionPrompts,
    moduleTransitionPrompts: prompts.moduleTransitionPrompts,
    courseCompletion: prompts.courseCompletionPrompt,
  },

  // UI customization
  ui: {
    sidebarWidth: 320,
    theme: 'microwave',
  },

  // Custom method: Check if module is unlocked
  isModuleUnlocked(moduleId, completedModules = []) {
    return true;
  },
});

export default microwavePersona;
