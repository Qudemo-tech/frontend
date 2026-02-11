/**
 * Microwave Persona - Module Definitions (Arabic)
 *
 * Arabic translation of modules.js - structure and logic values are identical.
 * The sidebar component reads from this config - no hardcoding in UI.
 */

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

export const courseStructure = [
  {
    id: 'section-intro',
    title: '1. مقدمة في الميكروويف',
    items: ['intro-microwaves', 'microwave-window-pdf', 'quiz-microwave-basics'],
  },
  {
    id: 'section-waveguides',
    title: '2. الموجات الدليلية والمكونات',
    items: ['waveguides-components', 'waveguide-video', 'quiz-hardware-physics'],
  },
  {
    id: 'section-radar-satellite',
    title: '3. الرادار والاتصالات الساتلية',
    items: ['radar-satellite', 'final-quiz'],
  },
];

export const moduleDefinitions = {
  'intro-microwaves': {
    id: 'intro-microwaves',
    title: 'مقدمة في الميكروويف',
    description: 'مكان الميكروويف في الطيف ولماذا طول موجته مهم',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.SIGNAL,
    hasVideo: false,
  },
  'microwave-window-pdf': {
    id: 'microwave-window-pdf',
    title: 'نافذة الميكروويف',
    description: 'طيف الميكروويف والأطوال الموجية والانتشار بالخط البصري',
    type: 'presentation',
    duration: '3m',
    icon: ICONS.BOOK_OPEN,
    hasVideo: false,
    hasPresentation: true,
    presentationConfig: 'microwave-window',
  },
  'quiz-microwave-basics': {
    id: 'quiz-microwave-basics',
    title: 'اختبار 1: أساسيات الميكروويف',
    description: 'اختبر فهمك لأساسيات الميكروويف',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'waveguides-components': {
    id: 'waveguides-components',
    title: 'الموجات الدليلية والمكونات',
    description: 'معدات متخصصة لإشارات الميكروويف',
    type: 'lesson',
    duration: '2m',
    icon: ICONS.ZAPS,
    hasVideo: false,
  },
  'waveguide-video': {
    id: 'waveguide-video',
    title: 'أساسيات تقنية الموجات الدليلية',
    description: 'تقنية الموجات الدليلية وانتشار الميكروويف',
    type: 'video',
    duration: '5m',
    icon: ICONS.VIDEO,
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/watch?v=Y7VaAI1NxiA',
  },
  'quiz-hardware-physics': {
    id: 'quiz-hardware-physics',
    title: 'اختبار 2: الأجهزة والفيزياء',
    description: 'اختبر معرفتك بالموجات الدليلية وأجهزة الميكروويف',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'radar-satellite': {
    id: 'radar-satellite',
    title: 'الرادار والاتصالات الساتلية',
    description: 'حالات استخدام الميكروويف: الرادار، الروابط نقطة لنقطة، الأقمار الصناعية',
    type: 'lesson',
    duration: '4m',
    icon: ICONS.GLOBE,
    hasVideo: false,
  },
  'final-quiz': {
    id: 'final-quiz',
    title: 'الاختبار النهائي: اختبار الإتقان',
    description: 'اختبر معرفتك الشاملة بتقنية الميكروويف',
    type: 'quiz',
    questions: 2,
    icon: ICONS.STAR,
    hasVideo: false,
  },
};

export const moduleOrder = [
  'intro-microwaves',
  'microwave-window-pdf',
  'quiz-microwave-basics',
  'waveguides-components',
  'waveguide-video',
  'quiz-hardware-physics',
  'radar-satellite',
  'final-quiz',
];

export const modulesRequiringConfirmation = [
  'intro-microwaves',
  'waveguides-components',
  'radar-satellite',
];

export const sectionEndingModules = [
  'quiz-microwave-basics',
  'quiz-hardware-physics',
];

export const courseMeta = {
  title: 'مقدمة في الميكروويف',
  description: 'دورة شاملة حول تقنية الميكروويف والموجات الدليلية والرادار والاتصالات الساتلية',
};

const microwaveModules = {
  order: moduleOrder,
  definitions: moduleDefinitions,
  requiresConfirmation: modulesRequiringConfirmation,
  sectionEndingModules: sectionEndingModules,
  courseStructure: courseStructure,
  courseMeta: courseMeta,
  icons: ICONS,
};

export default microwaveModules;
