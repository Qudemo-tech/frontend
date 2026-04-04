/**
 * DEWA Electrical Safety - Module Definitions (Arabic)
 *
 * Arabic translation of modules.js - structure and logic values are identical.
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
    title: '1. مقدمة في السلامة الكهربائية',
    items: ['intro-electrical-safety', 'electrical-hazards-video', 'quiz-electrical-safety'],
  },
  {
    id: 'section-ppe',
    title: '2. معدات الوقاية الشخصية وقواعد دخول الموقع',
    items: ['ppe-site-rules', 'quiz-ppe'],
  },
  {
    id: 'section-substations',
    title: '3. العمل داخل المحطات الفرعية',
    items: ['working-in-substations', 'final-quiz'],
  },
];

/**
 * Module definitions with all metadata
 */
export const moduleDefinitions = {
  'intro-electrical-safety': {
    id: 'intro-electrical-safety',
    title: 'مقدمة في السلامة الكهربائية',
    description: 'فهم المخاطر الكهربائية ومبادئ السلامة',
    type: 'lesson',
    duration: '4m',
    icon: ICONS.ZAP,
    hasVideo: false,
  },
  'electrical-hazards-video': {
    id: 'electrical-hazards-video',
    title: 'نظرة عامة على المخاطر الكهربائية',
    description: 'عرض مرئي للمخاطر الكهربائية الشائعة',
    type: 'video',
    duration: '5m',
    icon: ICONS.VIDEO,
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/watch?v=TMT6f3tZQSk',
  },
  'quiz-electrical-safety': {
    id: 'quiz-electrical-safety',
    title: 'اختبار السلامة الكهربائية',
    description: 'اختبر فهمك لأساسيات السلامة الكهربائية',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'ppe-site-rules': {
    id: 'ppe-site-rules',
    title: 'معدات الوقاية الشخصية وقواعد دخول الموقع',
    description: 'معدات الحماية الشخصية وإجراءات الوصول إلى الموقع',
    type: 'lesson',
    duration: '4m',
    icon: ICONS.SHIELD,
    hasVideo: false,
  },
  'quiz-ppe': {
    id: 'quiz-ppe',
    title: 'اختبار معدات الوقاية وقواعد الموقع',
    description: 'اختبر معرفتك بمتطلبات معدات الوقاية وقواعد دخول الموقع',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'working-in-substations': {
    id: 'working-in-substations',
    title: 'العمل داخل المحطات الفرعية',
    description: 'إجراءات السلامة لدخول المحطات الفرعية والعمل فيها',
    type: 'lesson',
    duration: '4m',
    icon: ICONS.LOCK,
    hasVideo: false,
  },
  'final-quiz': {
    id: 'final-quiz',
    title: 'الاختبار النهائي: سلامة ديوا',
    description: 'اختبر معرفتك الشاملة بالسلامة الكهربائية',
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
  title: 'أساسيات السلامة الكهربائية في ديوا',
  description: 'دورة شاملة حول السلامة الكهربائية ومتطلبات معدات الوقاية الشخصية وإجراءات المحطات الفرعية لموظفي ديوا',
};

const dewaModulesAr = {
  order: moduleOrder,
  definitions: moduleDefinitions,
  requiresConfirmation: modulesRequiringConfirmation,
  sectionEndingModules: sectionEndingModules,
  courseStructure: courseStructure,
  courseMeta: courseMeta,
  icons: ICONS,
};

export default dewaModulesAr;
