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
    },
    // Mobile logs endpoint (shared with mobile)
    mobileLogs: '/api/mobile-logs',
  }
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

export const getMobileLogsUrl = () => {
  return buildApiUrl(config.endpoints.mobileLogs);
};

export default config;
