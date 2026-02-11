/**
 * 5G Persona - Module Definitions (Arabic)
 *
 * Single source of truth for all 5G Essentials course modules.
 * Arabic translation of modules.js - structure and logic values are identical.
 * The sidebar component reads from this config - no hardcoding in UI.
 */

// Icon names (resolved in the component)
const ICONS = {
  CHECK_CIRCLE: 'CheckCircle',
  BOOK_OPEN: 'BookOpen',
  VIDEO: 'Video',
  AWARD: 'Award',
  WIFI: 'Wifi',
  ZAPS: 'Zap',
  GLOBE: 'Globe',
  LAYERS: 'Layers',
  STAR: 'Star',
  SIGNAL: 'Signal',
};

/**
 * Course structure for sidebar display
 * Each section contains items (modules) that appear in the sidebar
 */
export const courseStructure = [
  {
    id: 'section-intro',
    title: '1. مقدمة في 5G',
    items: ['intro-5g', '5g-revolution-video', 'quiz-5g-basics'],
  },
  {
    id: 'section-speed-latency',
    title: '2. السرعة وزمن الاستجابة',
    items: ['speed-latency-pdf', 'quiz-technical-specs'],
  },
  {
    id: 'section-applications',
    title: '3. التطبيقات الواقعية',
    items: ['real-world-applications', 'final-quiz'],
  },
];

/**
 * Module definitions with all metadata
 */
export const moduleDefinitions = {
  'intro-5g': {
    id: 'intro-5g',
    title: 'مقدمة في 5G',
    description: 'فهم ثورة 5G',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.WIFI,
    hasVideo: false,
  },
  '5g-revolution-video': {
    id: '5g-revolution-video',
    title: 'ثورة 5G',
    description: 'نظرة عامة شاملة على 5G',
    type: 'video',
    duration: '5m',
    icon: ICONS.VIDEO,
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/watch?v=mo1lNRKnayA',
  },
  'quiz-5g-basics': {
    id: 'quiz-5g-basics',
    title: 'اختبار أساسيات 5G',
    description: 'اختبر فهمك لأساسيات 5G',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'speed-latency-pdf': {
    id: 'speed-latency-pdf',
    title: 'السرعة وزمن الاستجابة',
    description: 'عرض النطاق الترددي وزمن الاستجابة وأداء 5G',
    type: 'presentation',
    duration: '4m',
    icon: ICONS.ZAPS,
    hasVideo: false,
    hasPresentation: true,
    presentationConfig: 'speed-latency',
  },
  'quiz-technical-specs': {
    id: 'quiz-technical-specs',
    title: 'اختبار المواصفات التقنية',
    description: 'اختبر معرفتك بمواصفات 5G',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'real-world-applications': {
    id: 'real-world-applications',
    title: 'التطبيقات الواقعية',
    description: 'حالات استخدام 5G عبر القطاعات المختلفة',
    type: 'lesson',
    duration: '4m',
    icon: ICONS.GLOBE,
    hasVideo: false,
  },
  'final-quiz': {
    id: 'final-quiz',
    title: 'الاختبار النهائي: رؤية 5G',
    description: 'اختبر معرفتك الشاملة بشبكة 5G',
    type: 'quiz',
    questions: 2,
    icon: ICONS.STAR,
    hasVideo: false,
  },
};

/**
 * Module order for flow control
 * This determines the progression through the course
 */
export const moduleOrder = [
  'intro-5g',
  '5g-revolution-video',
  'quiz-5g-basics',
  'speed-latency-pdf',
  'quiz-technical-specs',
  'real-world-applications',
  'final-quiz',
];

/**
 * Modules that require user confirmation before advancing
 * The avatar will wait for the user to say "yes", "continue", etc. before moving on
 */
export const modulesRequiringConfirmation = [
  'intro-5g',
  'real-world-applications',
];

/**
 * Section-ending modules - these are the last items in each course section
 * When these complete, the avatar should give a closing note and wait for user confirmation
 * before transitioning to the next section
 */
export const sectionEndingModules = [
  'quiz-5g-basics',        // End of Introduction to 5G
  'quiz-technical-specs',  // End of Speed and Latency
  // final-quiz is the last module, no transition needed
];

/**
 * Course metadata
 */
export const courseMeta = {
  title: 'أساسيات 5G: ربط المستقبل',
  description: 'دورة شاملة حول تقنية 5G وإمكانياتها وتطبيقاتها الواقعية',
};

const fiveGModules = {
  order: moduleOrder,
  definitions: moduleDefinitions,
  requiresConfirmation: modulesRequiringConfirmation,
  sectionEndingModules: sectionEndingModules,
  courseStructure: courseStructure,
  courseMeta: courseMeta,
  icons: ICONS,
};

export default fiveGModules;
