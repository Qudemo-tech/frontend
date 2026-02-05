/**
 * Schema Index
 *
 * Central export for all dataloader schemas.
 * Provides both named exports and a schemas object for dynamic lookup.
 */

import { courseSchema } from './course.schema.js';
import { moduleSchema } from './module.schema.js';
import { quizSchema } from './quiz.schema.js';
import { presentationSchema } from './presentation.schema.js';

/**
 * Schema lookup by content type
 * @type {Object.<string, Object>}
 */
export const schemas = {
  course: courseSchema,
  module: moduleSchema,
  quiz: quizSchema,
  presentation: presentationSchema,
};

// Named exports for direct imports
export { courseSchema, moduleSchema, quizSchema, presentationSchema };

export default schemas;
