/**
 * Qatar Persona Configuration
 *
 * Minimal configuration - inherits all defaults from base persona.
 * This ensures Qatar avatar has simple conversational behavior
 * without any learning modules, quizzes, or special flows.
 *
 * Persona ID: pf5e3d8bef4a
 */

import { createPersona } from '../basePersona';

const qatarPersona = createPersona({
  // Identification
  id: 'pf5e3d8bef4a',
  name: 'Qatar',
  description: 'Qatar conversational avatar',

  // All features disabled by default (inherited from base)
  // No need to specify features: {} - base defaults apply

  // No modules, quizzes, or special prompts
  // Simple conversational avatar
});

export default qatarPersona;
