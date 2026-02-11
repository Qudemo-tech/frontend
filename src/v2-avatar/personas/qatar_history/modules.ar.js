/**
 * Qatar History Persona - Module Definitions (Arabic)
 *
 * Arabic translation of modules.js - structure and logic values are identical.
 */

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

export const courseStructure = [
  {
    id: 'section-geography',
    title: '1. الجغرافيا والمستوطنات المبكرة',
    items: ['geography-intro', 'quiz-geography'],
  },
  {
    id: 'section-pearl-diving',
    title: '2. صيد اللؤلؤ والاقتصاد المبكر',
    items: ['pearl-diving-pdf', 'pearl-diving-intro', 'quiz-pearl-diving'],
  },
  {
    id: 'section-leadership',
    title: '3. القيادة والنفوذ البريطاني',
    items: ['leadership-intro', 'quiz-leadership'],
  },
  {
    id: 'section-independence',
    title: '4. الاستقلال وبناء الأمة',
    items: ['independence-intro', 'quiz-independence'],
  },
  {
    id: 'section-oil-gas',
    title: '5. النفط والغاز والتنمية السريعة',
    items: ['oil-gas-pdf', 'oil-gas-intro', 'quiz-oil-gas'],
  },
  {
    id: 'section-modern',
    title: '6. قطر في العالم الحديث',
    items: ['modern-qatar-intro', 'quiz-modern-qatar'],
  },
];

export const moduleDefinitions = {
  'geography-intro': {
    id: 'geography-intro',
    title: 'الجغرافيا والمستوطنات المبكرة',
    description: 'فهم جغرافية قطر وتاريخها المبكر',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.MAP,
    hasVideo: false,
  },
  'quiz-geography': {
    id: 'quiz-geography',
    title: 'اختبار الجغرافيا',
    description: 'اختبر فهمك لجغرافية قطر',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'pearl-diving-pdf': {
    id: 'pearl-diving-pdf',
    title: 'تراث صيد اللؤلؤ',
    description: 'نظرة مرئية على حقبة صيد اللؤلؤ',
    type: 'presentation',
    duration: '2m',
    icon: ICONS.ANCHOR,
    hasVideo: false,
    hasPresentation: true,
    presentationConfig: 'qatar-pearl-diving',
  },
  'pearl-diving-intro': {
    id: 'pearl-diving-intro',
    title: 'اقتصاد صيد اللؤلؤ',
    description: 'الأهمية الاقتصادية لصيد اللؤلؤ',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.ANCHOR,
    hasVideo: false,
  },
  'quiz-pearl-diving': {
    id: 'quiz-pearl-diving',
    title: 'اختبار صيد اللؤلؤ',
    description: 'اختبر معرفتك بصيد اللؤلؤ',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'leadership-intro': {
    id: 'leadership-intro',
    title: 'القيادة والنفوذ البريطاني',
    description: 'القيادة السياسية والعلاقات الإقليمية',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.CROWN,
    hasVideo: false,
  },
  'quiz-leadership': {
    id: 'quiz-leadership',
    title: 'اختبار القيادة',
    description: 'اختبر فهمك للحكم',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'independence-intro': {
    id: 'independence-intro',
    title: 'الاستقلال وبناء الأمة',
    description: 'مسار قطر نحو السيادة',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.FLAG,
    hasVideo: false,
  },
  'quiz-independence': {
    id: 'quiz-independence',
    title: 'اختبار الاستقلال',
    description: 'اختبر معرفتك باستقلال قطر',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'oil-gas-pdf': {
    id: 'oil-gas-pdf',
    title: 'نظرة عامة على النفط والغاز',
    description: 'نظرة مرئية على تنمية الطاقة',
    type: 'presentation',
    duration: '2m',
    icon: ICONS.FUEL,
    hasVideo: false,
    hasPresentation: true,
    presentationConfig: 'qatar-oil-gas',
  },
  'oil-gas-intro': {
    id: 'oil-gas-intro',
    title: 'الطاقة والتنمية',
    description: 'كيف غيّر النفط والغاز قطر',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.FUEL,
    hasVideo: false,
  },
  'quiz-oil-gas': {
    id: 'quiz-oil-gas',
    title: 'اختبار الطاقة',
    description: 'اختبر معرفتك بقطاع الطاقة في قطر',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'modern-qatar-intro': {
    id: 'modern-qatar-intro',
    title: 'قطر في العالم الحديث',
    description: 'دور قطر في الشؤون العالمية',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.GLOBE,
    hasVideo: false,
  },
  'quiz-modern-qatar': {
    id: 'quiz-modern-qatar',
    title: 'اختبار قطر الحديثة',
    description: 'اختبر فهمك لقطر الحديثة',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
};

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

export const modulesRequiringConfirmation = [
  'geography-intro',
  'pearl-diving-intro',
  'leadership-intro',
  'independence-intro',
  'oil-gas-intro',
  'modern-qatar-intro',
];

export const sectionEndingModules = [
  'quiz-geography',
  'quiz-pearl-diving',
  'quiz-leadership',
  'quiz-independence',
  'quiz-oil-gas',
];

export const courseMeta = {
  title: 'أساسيات تاريخ قطر: الجغرافيا والقيادة والدولة الحديثة',
  description: 'دورة شاملة عن تاريخ قطر من المستوطنات المبكرة إلى الدولة الحديثة',
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
