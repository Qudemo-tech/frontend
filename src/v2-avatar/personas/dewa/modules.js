/**
 * DEWA Electrical Safety - Module Definitions
 *
 * Single source of truth for all DEWA Electrical Safety course modules.
 */

const ICONS = {
  CHECK_CIRCLE: 'CheckCircle',
  BOOK_OPEN: 'BookOpen',
  VIDEO: 'Video',
  AWARD: 'Award',
  SHIELD: 'Shield',
  ZAP: 'Zap',
  HARD_HAT: 'HardHat',
  ALERT_TRIANGLE: 'AlertTriangle',
  STAR: 'Star',
  LOCK: 'Lock',
};

/**
 * Course structure for sidebar display
 */
export const courseStructure = [
  {
    id: 'section-electrical-safety',
    title: '1. Introduction to Electrical Safety',
    items: ['intro-electrical-safety', 'electrical-hazards-video', 'quiz-electrical-safety'],
  },
  {
    id: 'section-ppe',
    title: '2. PPE & Site Entry Rules',
    items: ['ppe-site-rules', 'quiz-ppe'],
  },
  {
    id: 'section-substations',
    title: '3. Working Inside Substations',
    items: ['working-in-substations', 'final-quiz'],
  },
];

/**
 * Module definitions with all metadata
 */
export const moduleDefinitions = {
  'intro-electrical-safety': {
    id: 'intro-electrical-safety',
    title: 'Introduction to Electrical Safety',
    description: 'Understanding electrical hazards and safety principles',
    type: 'lesson',
    duration: '4m',
    icon: ICONS.ZAP,
    hasVideo: false,
  },
  'electrical-hazards-video': {
    id: 'electrical-hazards-video',
    title: 'Electrical Hazards Overview',
    description: 'Visual overview of common electrical hazards',
    type: 'video',
    duration: '5m',
    icon: ICONS.VIDEO,
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/watch?v=TMT6f3tZQSk',
  },
  'quiz-electrical-safety': {
    id: 'quiz-electrical-safety',
    title: 'Electrical Safety Quiz',
    description: 'Test your understanding of electrical safety fundamentals',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'ppe-site-rules': {
    id: 'ppe-site-rules',
    title: 'PPE & Site Entry Rules',
    description: 'Personal protective equipment and site access procedures',
    type: 'lesson',
    duration: '4m',
    icon: ICONS.SHIELD,
    hasVideo: false,
  },
  'quiz-ppe': {
    id: 'quiz-ppe',
    title: 'PPE & Site Rules Quiz',
    description: 'Test your knowledge of PPE requirements and site entry rules',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'working-in-substations': {
    id: 'working-in-substations',
    title: 'Working Inside Substations',
    description: 'Safety procedures for substation entry and operations',
    type: 'lesson',
    duration: '4m',
    icon: ICONS.LOCK,
    hasVideo: false,
  },
  'final-quiz': {
    id: 'final-quiz',
    title: 'Final Quiz: DEWA Safety',
    description: 'Test your overall electrical safety knowledge',
    type: 'quiz',
    questions: 2,
    icon: ICONS.STAR,
    hasVideo: false,
  },
};

/**
 * Module order for flow control
 */
export const moduleOrder = [
  'intro-electrical-safety',
  'electrical-hazards-video',
  'quiz-electrical-safety',
  'ppe-site-rules',
  'quiz-ppe',
  'working-in-substations',
  'final-quiz',
];

/**
 * Modules that require user confirmation before advancing
 */
export const modulesRequiringConfirmation = [
  'intro-electrical-safety',
  'ppe-site-rules',
  'working-in-substations',
];

/**
 * Section-ending modules
 */
export const sectionEndingModules = [
  'quiz-electrical-safety',
  'quiz-ppe',
];

/**
 * Course metadata
 */
export const courseMeta = {
  title: 'DEWA Electrical Safety Essentials',
  description: 'A comprehensive course on electrical safety, PPE requirements, and substation procedures for DEWA personnel',
};

const dewaModules = {
  order: moduleOrder,
  definitions: moduleDefinitions,
  requiresConfirmation: modulesRequiringConfirmation,
  sectionEndingModules: sectionEndingModules,
  courseStructure: courseStructure,
  courseMeta: courseMeta,
  icons: ICONS,
};

export default dewaModules;
