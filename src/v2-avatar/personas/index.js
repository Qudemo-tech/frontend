/**
 * Persona Factory
 *
 * Central registry for all persona configurations.
 * Returns the appropriate persona config based on persona ID.
 *
 * Usage:
 *   import { getPersona, hasFeature } from '../personas';
 *
 *   const persona = getPersona(personaId);
 *   if (persona.hasFeature('mcqQuiz')) { ... }
 */

import basePersona, { createPersona } from './basePersona';
import entriPersona from './entri';
import qatarPersona from './qatar';
import evolutionPersona from './evolution';
import { PersonaAdapter } from '../dataloader/PersonaAdapter';

// Registry of all known personas
const personaRegistry = {
  // Entri onboarding
  'p54ceeb77022': entriPersona,

  // Qatar conversational
  'pf5e3d8bef4a': qatarPersona,

  // Evolution learning
  'p99b6eb28083': evolutionPersona,
};

/**
 * Get persona configuration by ID
 *
 * @param {string} personaId - The persona ID
 * @returns {object} Persona configuration (defaults to base if not found)
 */
export const getPersona = (personaId) => {
  // Feature flag: use DataLoader when enabled
  if (process.env.REACT_APP_USE_DATA_LOADER === 'true') {
    if (!personaId) {
      console.warn('[Persona] No persona ID provided, using default via DataLoader');
      return new PersonaAdapter('default');
    }

    if (!PersonaAdapter.isKnownPersona(personaId)) {
      console.warn(`[Persona] Unknown persona ID: ${personaId}, using as-is via DataLoader`);
    }

    return new PersonaAdapter(personaId);
  }

  // Legacy path: use hardcoded persona configs
  if (!personaId) {
    console.warn('[Persona] No persona ID provided, using default');
    return createPersona({ id: null, name: 'Default' });
  }

  const persona = personaRegistry[personaId];

  if (!persona) {
    console.warn(`[Persona] Unknown persona ID: ${personaId}, using default`);
    return createPersona({ id: personaId, name: 'Unknown' });
  }

  return persona;
};

/**
 * Check if a persona has a specific feature enabled
 *
 * @param {string} personaId - The persona ID
 * @param {string} featureName - The feature to check
 * @returns {boolean} True if feature is enabled
 */
export const hasFeature = (personaId, featureName) => {
  const persona = getPersona(personaId);
  return persona.hasFeature(featureName);
};

/**
 * Get all registered persona IDs
 *
 * @returns {string[]} Array of persona IDs
 */
export const getAllPersonaIds = () => {
  return Object.keys(personaRegistry);
};

/**
 * Check if a persona ID is registered
 *
 * @param {string} personaId - The persona ID
 * @returns {boolean} True if persona is registered
 */
export const isRegisteredPersona = (personaId) => {
  return personaId in personaRegistry;
};

// Export individual personas for direct access if needed
export { entriPersona, qatarPersona, evolutionPersona, basePersona };

const personaApi = {
  getPersona,
  hasFeature,
  getAllPersonaIds,
  isRegisteredPersona,
};

export default personaApi;
