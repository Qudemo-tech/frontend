/**
 * 5G Persona Configuration
 *
 * Complete configuration for the 5G Essentials course avatar.
 * Course: 5G Essentials: Connecting the Future
 */

import { createPersona } from '../basePersona';
import modules from './modules';
import modulesAr from './modules.ar';
import quizzes from './quizzes';
import quizzesAr from './quizzes.ar';
import prompts from './prompts';
import promptsAr from './prompts.ar';

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
    languageToggle: true,

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
    theme: '5g',
  },

  // Custom method: Check if module is unlocked
  isModuleUnlocked(moduleId, completedModules = []) {
    // All modules are unlocked (linear progression handled by flow)
    return true;
  },
});

fiveGPersona.getLocalizedContent = (language) => {
  if (language === 'ar') {
    return {
      modules: {
        order: modulesAr.order,
        definitions: modulesAr.definitions,
        requiresConfirmation: modulesAr.requiresConfirmation,
        sectionEndingModules: modulesAr.sectionEndingModules,
        courseStructure: modulesAr.courseStructure,
        courseMeta: modulesAr.courseMeta,
      },
      quizzes: {
        moduleQuizzes: quizzesAr.moduleQuizzes,
        finalQuiz: quizzesAr.finalQuiz,
      },
      prompts: {
        welcome: promptsAr.welcomeMessage,
        modulePrompts: promptsAr.modulePrompts,
        videoCompletionPrompts: promptsAr.videoCompletionPrompts,
        moduleTransitionPrompts: promptsAr.moduleTransitionPrompts,
        courseCompletion: promptsAr.courseCompletionPrompt,
      },
      presentationSuffix: '-ar',
    };
  }
  // Default: English
  return {
    modules: {
      order: modules.order,
      definitions: modules.definitions,
      requiresConfirmation: modules.requiresConfirmation,
      sectionEndingModules: modules.sectionEndingModules,
      courseStructure: modules.courseStructure,
      courseMeta: modules.courseMeta,
    },
    quizzes: {
      moduleQuizzes: quizzes.moduleQuizzes,
      finalQuiz: quizzes.finalQuiz,
    },
    prompts: {
      welcome: prompts.welcomeMessage,
      modulePrompts: prompts.modulePrompts,
      videoCompletionPrompts: prompts.videoCompletionPrompts,
      moduleTransitionPrompts: prompts.moduleTransitionPrompts,
      courseCompletion: prompts.courseCompletionPrompt,
    },
    presentationSuffix: '',
  };
};

export default fiveGPersona;
