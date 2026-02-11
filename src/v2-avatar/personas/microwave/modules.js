/**
 * Microwave Persona - Module Definitions
 *
 * Single source of truth for all Microwave Technology course modules.
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
    title: '1. Introduction to Microwaves',
    items: ['intro-microwaves', 'microwave-window-pdf', 'quiz-microwave-basics'],
  },
  {
    id: 'section-waveguides',
    title: '2. Waveguides and Components',
    items: ['waveguides-components', 'waveguide-video', 'quiz-hardware-physics'],
  },
  {
    id: 'section-radar-satellite',
    title: '3. Radar and Satellite Comms',
    items: ['radar-satellite', 'final-quiz'],
  },
];

export const moduleDefinitions = {
  'intro-microwaves': {
    id: 'intro-microwaves',
    title: 'Introduction to Microwaves',
    description: 'Where microwaves sit on the spectrum and why their wavelength matters',
    type: 'lesson',
    duration: '3m',
    icon: ICONS.SIGNAL,
    hasVideo: false,
  },
  'microwave-window-pdf': {
    id: 'microwave-window-pdf',
    title: 'The Microwave Window',
    description: 'Microwave spectrum, wavelengths, and line-of-sight propagation',
    type: 'presentation',
    duration: '3m',
    icon: ICONS.BOOK_OPEN,
    hasVideo: false,
    hasPresentation: true,
    presentationConfig: 'microwave-window',
  },
  'quiz-microwave-basics': {
    id: 'quiz-microwave-basics',
    title: 'Quiz 1: Microwave Basics',
    description: 'Test your understanding of microwave fundamentals',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'waveguides-components': {
    id: 'waveguides-components',
    title: 'Waveguides and Components',
    description: 'Specialized hardware for microwave signals',
    type: 'lesson',
    duration: '2m',
    icon: ICONS.ZAPS,
    hasVideo: false,
  },
  'waveguide-video': {
    id: 'waveguide-video',
    title: 'Fundamentals of Waveguide Technology',
    description: 'Waveguide technology and microwave propagation',
    type: 'video',
    duration: '5m',
    icon: ICONS.VIDEO,
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/watch?v=Y7VaAI1NxiA',
  },
  'quiz-hardware-physics': {
    id: 'quiz-hardware-physics',
    title: 'Quiz 2: Hardware & Physics',
    description: 'Test your knowledge of waveguides and microwave hardware',
    type: 'quiz',
    questions: 2,
    icon: ICONS.AWARD,
    hasVideo: false,
  },
  'radar-satellite': {
    id: 'radar-satellite',
    title: 'Radar and Satellite Comms',
    description: 'Microwave use cases: radar, point-to-point links, satellite',
    type: 'lesson',
    duration: '4m',
    icon: ICONS.GLOBE,
    hasVideo: false,
  },
  'final-quiz': {
    id: 'final-quiz',
    title: 'Final Quiz: Mastery Check',
    description: 'Test your overall microwave technology knowledge',
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
  title: 'Introduction to Microwaves',
  description: 'A comprehensive course on microwave technology, waveguides, radar, and satellite communications',
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
