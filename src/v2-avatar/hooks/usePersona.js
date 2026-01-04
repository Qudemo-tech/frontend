/**
 * usePersona Hook
 *
 * React hook to get and use persona configuration.
 *
 * Usage:
 *   const persona = usePersona(personaId);
 *
 *   // Check features
 *   if (persona.hasFeature('mcqQuiz')) { ... }
 *
 *   // Get module info
 *   const modules = persona.modules.order;
 *   const quiz = persona.getModuleQuiz('posh-info');
 */

import { useMemo } from 'react';
import { getPersona } from '../personas';

/**
 * Hook to get persona configuration
 *
 * @param {string} personaId - The persona ID
 * @returns {object} Persona configuration with helper methods
 */
export const usePersona = (personaId) => {
  const persona = useMemo(() => {
    return getPersona(personaId);
  }, [personaId]);

  return persona;
};

/**
 * Hook to check if persona has a specific feature
 *
 * @param {string} personaId - The persona ID
 * @param {string} featureName - The feature to check
 * @returns {boolean} True if feature is enabled
 */
export const usePersonaFeature = (personaId, featureName) => {
  const persona = usePersona(personaId);
  return useMemo(() => {
    return persona.hasFeature(featureName);
  }, [persona, featureName]);
};

/**
 * Hook to get all enabled features for a persona
 *
 * @param {string} personaId - The persona ID
 * @returns {object} Object with feature names as keys and boolean values
 */
export const usePersonaFeatures = (personaId) => {
  const persona = usePersona(personaId);
  return persona.features;
};

/**
 * Hook to get module configuration
 *
 * @param {string} personaId - The persona ID
 * @returns {object} Module configuration { order, definitions, requiresConfirmation }
 */
export const usePersonaModules = (personaId) => {
  const persona = usePersona(personaId);
  return persona.modules;
};

/**
 * Hook to get quiz configuration for a module
 *
 * @param {string} personaId - The persona ID
 * @param {string} moduleId - The module ID
 * @returns {object|null} Quiz configuration or null
 */
export const useModuleQuiz = (personaId, moduleId) => {
  const persona = usePersona(personaId);
  return useMemo(() => {
    return persona.getModuleQuiz(moduleId);
  }, [persona, moduleId]);
};

export default usePersona;
