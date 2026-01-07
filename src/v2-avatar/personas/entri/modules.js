/**
 * Entri Persona - Module Definitions
 *
 * Single source of truth for all Entri onboarding modules.
 * The sidebar component reads from this config - no hardcoding in UI.
 */

// Icon names (resolved in the component)
const ICONS = {
  CHECK_CIRCLE: 'CheckCircle',
  BOOK_OPEN: 'BookOpen',
  SHIELD: 'Shield',
  HEART: 'Heart',
  USERS: 'Users',
  AWARD: 'Award',
  BUILDING: 'Building2',
  VIDEO: 'Video',
  BRIEFCASE: 'Briefcase',
  LAYERS: 'Layers',
  STAR: 'Star',
};

/**
 * Course structure for sidebar display
 * Each section contains items (modules) that appear in the sidebar
 */
export const courseStructure = [
  {
    id: 'section-welcome',
    title: '1. Welcome & Introduction',
    items: ['welcome-intro', 'founder-video', 'founder-video-quiz'],
  },
  {
    id: 'section-success-stories',
    title: '2. User Success Stories',
    items: ['user-success-stories'],
  },
  {
    id: 'section-functions',
    title: '3. Functions at Entri',
    items: ['functions-at-entri', 'functions-at-entri-quiz'],
  },
  {
    id: 'section-hr-policies',
    title: '4. HR Policies',
    items: ['hr-policies', 'hr-policies-quiz'],
  },
  {
    id: 'section-posh',
    title: '5. POSH Information',
    items: ['posh-info', 'posh-quiz'],
  },
  {
    id: 'section-employee-benefits',
    title: '6. Employee Benefits',
    items: ['employee-benefits', 'employee-benefits-quiz'],
  },
  {
    id: 'section-assessment',
    title: '7. Final Assessment',
    items: ['final-quiz'],
  },
];

/**
 * Module definitions with all metadata
 */
export const moduleDefinitions = {
  'welcome-intro': {
    id: 'welcome-intro',
    title: 'Welcome to Entri',
    description: 'Introduction to Entri',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.CHECK_CIRCLE,
    hasVideo: false,
  },
  'founder-video': {
    id: 'founder-video',
    title: "Founder's Video",
    description: 'Meet the founders of Entri',
    type: 'video',
    duration: '5m',
    icon: ICONS.VIDEO,
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/watch?v=YtB5fjEO1zc',
  },
  'founder-video-quiz': {
    id: 'founder-video-quiz',
    title: "Founder's Video Quiz",
    description: 'Test your understanding of the video',
    type: 'quiz',
    questions: 8,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'user-success-stories': {
    id: 'user-success-stories',
    title: 'User Success Stories',
    description: 'Inspiring stories from Entri users',
    type: 'video',
    duration: '5m',
    icon: ICONS.STAR,
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/watch?v=5R35-Yxkw2Y',
  },
  'functions-at-entri': {
    id: 'functions-at-entri',
    title: 'Functions at Entri',
    description: 'Different functions and teams',
    type: 'presentation',
    duration: '4m',
    icon: ICONS.BRIEFCASE,
    hasVideo: false,
    hasPresentation: true,
    presentationConfig: 'functions-at-entri', // References presentation file
  },
  'functions-at-entri-quiz': {
    id: 'functions-at-entri-quiz',
    title: 'Functions Quiz',
    description: 'Test your knowledge of Entri functions',
    type: 'quiz',
    questions: 8,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'hr-policies': {
    id: 'hr-policies',
    title: 'HR Policies',
    description: 'Working hours, leave policy, and benefits',
    type: 'presentation',
    duration: '8m',
    icon: ICONS.BOOK_OPEN,
    hasVideo: false,
    hasPresentation: true,
    presentationConfig: 'hr-policies',
  },
  'hr-policies-quiz': {
    id: 'hr-policies-quiz',
    title: 'HR Policies Quiz',
    description: 'Test your knowledge of HR policies',
    type: 'quiz',
    questions: 7,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'posh-info': {
    id: 'posh-info',
    title: 'Prevention of Sexual Harassment',
    description: 'POSH Policy overview',
    type: 'video',
    duration: '10m',
    icon: ICONS.SHIELD,
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/watch?v=XPAhyFETMpM',
  },
  'posh-quiz': {
    id: 'posh-quiz',
    title: 'POSH Quiz',
    description: 'Test your knowledge of POSH policies',
    type: 'quiz',
    questions: 9,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'employee-benefits': {
    id: 'employee-benefits',
    title: 'Benefits Overview',
    description: 'Your benefits at Entri',
    type: 'presentation',
    duration: '8m',
    icon: ICONS.HEART,
    hasVideo: false,
    hasPresentation: true,
    presentationConfig: 'employee-benefits',
  },
  'employee-benefits-quiz': {
    id: 'employee-benefits-quiz',
    title: 'Employee Benefits Quiz',
    description: 'Test your knowledge of employee benefits',
    type: 'quiz',
    questions: 5,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'final-quiz': {
    id: 'final-quiz',
    title: 'Final Quiz',
    description: 'Test your knowledge',
    type: 'quiz',
    questions: 5,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
};

/**
 * Module order for flow control
 * This determines the progression through the onboarding
 */
export const moduleOrder = [
  'welcome-intro',
  'founder-video',
  'founder-video-quiz',
  'user-success-stories',
  'functions-at-entri',
  'functions-at-entri-quiz',
  'hr-policies',
  'hr-policies-quiz',
  'posh-info',
  'posh-quiz',
  'employee-benefits',
  'employee-benefits-quiz',
  'final-quiz',
];

/**
 * Modules that require user confirmation before advancing
 * The avatar will wait for the user to say "yes", "continue", etc. before moving on
 */
export const modulesRequiringConfirmation = [
  'welcome-intro',
  'functions-at-entri',
  'hr-policies',
];

/**
 * Section-ending modules - these are the last items in each course section
 * When these complete, the avatar should give a closing note and wait for user confirmation
 * before transitioning to the next section
 */
export const sectionEndingModules = [
  'founder-video-quiz',      // End of Welcome & Introduction
  'user-success-stories',    // End of User Success Stories
  'functions-at-entri-quiz', // End of Functions at Entri
  'hr-policies-quiz',        // End of HR Policies
  'posh-quiz',               // End of POSH Information
  'employee-benefits-quiz',  // End of Employee Benefits
  // final-quiz is the last module, no transition needed
];

/**
 * Course metadata
 */
export const courseMeta = {
  title: 'Entri Employee Onboarding',
  description: 'Complete onboarding program for new Entri employees',
};

const entriModules = {
  order: moduleOrder,
  definitions: moduleDefinitions,
  requiresConfirmation: modulesRequiringConfirmation,
  sectionEndingModules: sectionEndingModules,
  courseStructure: courseStructure,
  courseMeta: courseMeta,
  icons: ICONS,
};

export default entriModules;
