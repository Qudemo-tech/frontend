/**
 * Entri Persona - Module Definitions
 *
 * Defines the module order, content, and flow for Entri onboarding.
 */

export const moduleOrder = [
  'welcome-intro',
  'founder-video',
  'posh-info',
  'employee-benefits',
  'lifestyle-benefits',
  'company-rules',
  'final-quiz'
];

export const modulesRequiringConfirmation = [
  'posh-info',
  'employee-benefits',
  'lifestyle-benefits',
  'company-rules'
];

export const moduleDefinitions = {
  'welcome-intro': {
    id: 'welcome-intro',
    title: 'Welcome',
    description: 'Introduction to Entri',
    duration: 60,
    hasVideo: false,
  },
  'founder-video': {
    id: 'founder-video',
    title: 'Our Founders',
    description: 'Meet the founders of Entri',
    duration: 180,
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/watch?v=jlCxAsyVeFE',
  },
  'posh-info': {
    id: 'posh-info',
    title: 'POSH Policy',
    description: 'Prevention of Sexual Harassment',
    duration: 45,
    hasVideo: false,
  },
  'employee-benefits': {
    id: 'employee-benefits',
    title: 'Employee Benefits',
    description: 'Your benefits at Entri',
    duration: 45,
    hasVideo: false,
  },
  'lifestyle-benefits': {
    id: 'lifestyle-benefits',
    title: 'Lifestyle Benefits',
    description: 'Work-life balance at Entri',
    duration: 45,
    hasVideo: false,
  },
  'company-rules': {
    id: 'company-rules',
    title: 'Company Rules',
    description: 'Guidelines and policies',
    duration: 45,
    hasVideo: false,
  },
  'final-quiz': {
    id: 'final-quiz',
    title: 'Final Quiz',
    description: 'Test your knowledge',
    duration: 120,
    hasVideo: false,
  },
};

export default {
  order: moduleOrder,
  definitions: moduleDefinitions,
  requiresConfirmation: modulesRequiringConfirmation,
};
