/**
 * Qatar History Persona - Module Definitions
 *
 * Single source of truth for all Qatar History Essentials course modules.
 * The sidebar component reads from this config - no hardcoding in UI.
 */

// Icon names (resolved in the component)
const ICONS = {
  CHECK_CIRCLE: 'CheckCircle',
  BOOK_OPEN: 'BookOpen',
  VIDEO: 'Video',
  AWARD: 'Award',
  MAP: 'Map',
  ANCHOR: 'Anchor',
  CROWN: 'Crown',
  FLAG: 'Flag',
  FUEL: 'Fuel',
  GLOBE: 'Globe',
  STAR: 'Star',
};

/**
 * Course structure for sidebar display
 * Each section contains items (modules) that appear in the sidebar
 */
export const courseStructure = [
  {
    id: 'section-geography',
    title: '1. Geography and Early Settlements',
    items: ['geography-intro', 'quiz-geography'],
  },
  {
    id: 'section-pearl-diving',
    title: '2. Pearl Diving and Early Economy',
    items: ['pearl-diving-pdf', 'pearl-diving-intro', 'quiz-pearl-diving'],
  },
  {
    id: 'section-leadership',
    title: '3. Leadership and British Influence',
    items: ['leadership-intro', 'quiz-leadership'],
  },
  {
    id: 'section-independence',
    title: '4. Independence and Nation Building',
    items: ['independence-intro', 'quiz-independence'],
  },
  {
    id: 'section-oil-gas',
    title: '5. Oil, Gas, and Rapid Development',
    items: ['oil-gas-pdf', 'oil-gas-intro', 'quiz-oil-gas'],
  },
  {
    id: 'section-modern',
    title: '6. Qatar in the Modern World',
    items: ['modern-qatar-intro', 'quiz-modern-qatar'],
  },
];

/**
 * Module definitions with all metadata
 */
export const moduleDefinitions = {
  'geography-intro': {
    id: 'geography-intro',
    title: 'Geography and Early Settlements',
    description: 'Understanding Qatar\'s geography and early history',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.MAP,
    hasVideo: false,
  },
  'quiz-geography': {
    id: 'quiz-geography',
    title: 'Geography Quiz',
    description: 'Test your understanding of Qatar\'s geography',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'pearl-diving-pdf': {
    id: 'pearl-diving-pdf',
    title: 'Pearl Diving Heritage',
    description: 'Visual overview of pearl diving era',
    type: 'presentation',
    duration: '2m',
    icon: ICONS.ANCHOR,
    hasVideo: false,
    hasPresentation: true,
    presentationConfig: 'qatar-pearl-diving',
  },
  'pearl-diving-intro': {
    id: 'pearl-diving-intro',
    title: 'Pearl Diving Economy',
    description: 'The economic importance of pearl diving',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.ANCHOR,
    hasVideo: false,
  },
  'quiz-pearl-diving': {
    id: 'quiz-pearl-diving',
    title: 'Pearl Diving Quiz',
    description: 'Test your knowledge of pearl diving',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'leadership-intro': {
    id: 'leadership-intro',
    title: 'Leadership and British Influence',
    description: 'Political leadership and regional relations',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.CROWN,
    hasVideo: false,
  },
  'quiz-leadership': {
    id: 'quiz-leadership',
    title: 'Leadership Quiz',
    description: 'Test your understanding of governance',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'independence-intro': {
    id: 'independence-intro',
    title: 'Independence and Nation Building',
    description: 'Qatar\'s path to sovereignty',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.FLAG,
    hasVideo: false,
  },
  'quiz-independence': {
    id: 'quiz-independence',
    title: 'Independence Quiz',
    description: 'Test your knowledge of Qatar\'s independence',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'oil-gas-pdf': {
    id: 'oil-gas-pdf',
    title: 'Oil and Gas Overview',
    description: 'Visual overview of energy development',
    type: 'presentation',
    duration: '2m',
    icon: ICONS.FUEL,
    hasVideo: false,
    hasPresentation: true,
    presentationConfig: 'qatar-oil-gas',
  },
  'oil-gas-intro': {
    id: 'oil-gas-intro',
    title: 'Energy and Development',
    description: 'How oil and gas transformed Qatar',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.FUEL,
    hasVideo: false,
  },
  'quiz-oil-gas': {
    id: 'quiz-oil-gas',
    title: 'Energy Quiz',
    description: 'Test your knowledge of Qatar\'s energy sector',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'modern-qatar-intro': {
    id: 'modern-qatar-intro',
    title: 'Qatar in the Modern World',
    description: 'Qatar\'s role in global affairs',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.GLOBE,
    hasVideo: false,
  },
  'quiz-modern-qatar': {
    id: 'quiz-modern-qatar',
    title: 'Modern Qatar Quiz',
    description: 'Test your understanding of modern Qatar',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
};

/**
 * Module order for flow control
 * This determines the progression through the course
 */
export const moduleOrder = [
  'geography-intro',
  'quiz-geography',
  'pearl-diving-pdf',
  'pearl-diving-intro',
  'quiz-pearl-diving',
  'leadership-intro',
  'quiz-leadership',
  'independence-intro',
  'quiz-independence',
  'oil-gas-pdf',
  'oil-gas-intro',
  'quiz-oil-gas',
  'modern-qatar-intro',
  'quiz-modern-qatar',
];

/**
 * Modules that require user confirmation before advancing
 * The avatar will wait for the user to say "yes", "continue", etc. before moving on
 */
export const modulesRequiringConfirmation = [
  'geography-intro',
  'pearl-diving-intro',
  'leadership-intro',
  'independence-intro',
  'oil-gas-intro',
  'modern-qatar-intro',
];

/**
 * Section-ending modules - these are the last items in each course section
 * When these complete, the avatar should give a closing note and wait for user confirmation
 * before transitioning to the next section
 */
export const sectionEndingModules = [
  'quiz-geography',
  'quiz-pearl-diving',
  'quiz-leadership',
  'quiz-independence',
  'quiz-oil-gas',
  // quiz-modern-qatar is the last module, no transition needed
];

/**
 * Course metadata
 */
export const courseMeta = {
  title: 'Qatar History Essentials: Geography, Leadership, and Modern Nationhood',
  description: 'A comprehensive course on Qatar\'s history from early settlements to modern nationhood',
};

const qatarHistoryModules = {
  order: moduleOrder,
  definitions: moduleDefinitions,
  requiresConfirmation: modulesRequiringConfirmation,
  sectionEndingModules: sectionEndingModules,
  courseStructure: courseStructure,
  courseMeta: courseMeta,
  icons: ICONS,
};

export default qatarHistoryModules;
