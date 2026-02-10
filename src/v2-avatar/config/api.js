// API Configuration for Tavus V2 Avatar

const config = {
  // API Base URLs
  // In production (Vercel), use empty string for relative URLs to serverless functions
  // In development, use localhost
  NODE_API_URL: process.env.REACT_APP_NODE_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000'),

  // Tavus API endpoints (via serverless functions)
  endpoints: {
    tavus: {
      createConversation: '/api/tavus/create-conversation',
      endConversation: '/api/tavus/end-conversation',
      cleanupAllSessions: '/api/tavus/cleanup-all-sessions',
    },
    // Mobile logs endpoint (shared with mobile)
    mobileLogs: '/api/mobile-logs',
  }
};

// Persona ID mapping - friendly names to Tavus persona IDs
// Usage: /v2-avatar/qatar instead of /v2-avatar/1765893169386
export const PERSONA_MAP = {
  'qatar': 'pf5e3d8bef4a',
  'evolution': 'p99b6eb28083',
  'entri': 'p54ceeb77022',
  '5g': 'p607dc212fc9', 
  'qatar_history': 'p3e5e7b16b65', // lowercase for case-insensitive URL matching
  // Add more personas here as needed
  // 'friendly-name': 'actual-persona-id',
};

// Resolve a persona identifier (either friendly name or raw ID) to the actual persona ID
export const resolvePersonaId = (personaIdentifier) => {
  if (!personaIdentifier) return null;
  
  // Check if it's a friendly name in our map
  const mappedId = PERSONA_MAP[personaIdentifier.toLowerCase()];
  if (mappedId) {
    return mappedId;
  }
  
  // Otherwise, assume it's already a raw persona ID
  return personaIdentifier;
};

// Get the display name for a persona ID (reverse lookup)
export const getPersonaDisplayName = (personaId) => {
  const entry = Object.entries(PERSONA_MAP).find(([name, id]) => id === personaId);
  return entry ? entry[0] : personaId;
};

// Helper function to get the Node API URL
export const getApiUrl = () => {
  return config.NODE_API_URL;
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${config.NODE_API_URL}${endpoint}`;
};

// Helper function to get Tavus API URL
export const getTavusApiUrl = (endpoint) => {
  return buildApiUrl(endpoint);
};

// Specific endpoint helpers
export const getCreateConversationUrl = () => {
  return buildApiUrl(config.endpoints.tavus.createConversation);
};

export const getEndConversationUrl = () => {
  return buildApiUrl(config.endpoints.tavus.endConversation);
};

export const getCleanupAllSessionsUrl = () => {
  return buildApiUrl(config.endpoints.tavus.cleanupAllSessions);
};

export const getMobileLogsUrl = () => {
  return buildApiUrl(config.endpoints.mobileLogs);
};

export default config;
