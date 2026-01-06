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
    items: ['posh-info'],
  },
  {
    id: 'section-employee-benefits',
    title: '6. Employee Benefits',
    items: ['employee-benefits'],
  },
  {
    id: 'section-lifestyle',
    title: '7. Lifestyle Benefits',
    items: ['lifestyle-benefits'],
  },
  {
    id: 'section-rules',
    title: '8. Company Rules and Policies',
    items: ['company-rules'],
  },
  {
    id: 'section-assessment',
    title: 'Assessment',
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
    type: 'lesson',
    duration: '4m',
    icon: ICONS.SHIELD,
    hasVideo: false,
  },
  'employee-benefits': {
    id: 'employee-benefits',
    title: 'Benefits Overview',
    description: 'Your benefits at Entri',
    type: 'lesson',
    duration: '6m',
    icon: ICONS.HEART,
    hasVideo: false,
  },
  'lifestyle-benefits': {
    id: 'lifestyle-benefits',
    title: 'Wellness & Recreation',
    description: 'Work-life balance at Entri',
    type: 'lesson',
    duration: '5m',
    icon: ICONS.USERS,
    hasVideo: false,
  },
  'company-rules': {
    id: 'company-rules',
    title: 'Rules and Policies',
    description: 'Company guidelines',
    type: 'lesson',
    duration: '7m',
    icon: ICONS.BOOK_OPEN,
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
  'employee-benefits',
  'lifestyle-benefits',
  'company-rules',
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
  'posh-info',
  'employee-benefits',
  'lifestyle-benefits',
  'company-rules',
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
  courseStructure: courseStructure,
  courseMeta: courseMeta,
  icons: ICONS,
};

export default entriModules;
