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
};

/**
 * Course structure for sidebar display
 * Each section contains items (modules) that appear in the sidebar
 */
export const courseStructure = [
  {
    id: 'section-welcome',
    title: '1. Welcome & Introduction',
    items: ['welcome-intro', 'founder-video'],
  },
  {
    id: 'section-posh',
    title: '2. POSH Information',
    items: ['posh-info'],
  },
  {
    id: 'section-employee-benefits',
    title: '3. Employee Benefits',
    items: ['employee-benefits'],
  },
  {
    id: 'section-lifestyle',
    title: '4. Lifestyle Benefits',
    items: ['lifestyle-benefits'],
  },
  {
    id: 'section-rules',
    title: '5. Company Rules and Policies',
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
