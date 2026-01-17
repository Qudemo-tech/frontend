/**
 * Evolution Persona - Module Definitions
 *
 * Defines the module order and content for Evolution learning.
 */

export const moduleOrder = [
  'natural-selection',
  'genetic-drift',
  'fossil-record',
  'final-quiz'
];

export const moduleDefinitions = {
  'natural-selection': {
    id: 'natural-selection',
    title: 'Natural Selection',
    description: 'How living things change over time',
    duration: 60,
    hasVideo: false,
  },
  'genetic-drift': {
    id: 'genetic-drift',
    title: 'Genetic Drift',
    description: 'Random changes in populations',
    duration: 60,
    hasVideo: false,
  },
  'fossil-record': {
    id: 'fossil-record',
    title: 'Fossil Record',
    description: 'Evidence of evolution',
    duration: 60,
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

export const modulePrompts = {
  'natural-selection': "Let's discuss natural selection! This is how living things change over time. Animals that are better at surviving pass on their traits to their babies. Can you think of an example of natural selection?",
  'genetic-drift': "Great! Let's explore genetic drift. This happens when random chance affects which traits get passed down in a population. It's like flipping a coin - sometimes you get heads, sometimes tails. What questions do you have about genetic drift?",
  'fossil-record': "Excellent choice! The fossil record shows us evidence of evolution over millions of years. Fossils are like nature's history book. What would you like to know about fossils?",
  'final-quiz': "Perfect! It's time for the final quiz. I'll ask you a few questions to see how much you've learned. Are you ready to begin?"
};

const evolutionModules = {
  order: moduleOrder,
  definitions: moduleDefinitions,
  requiresConfirmation: [], // No confirmation required for Evolution
  prompts: modulePrompts,
};

export default evolutionModules;
