# Coding Conventions

**Analysis Date:** 2026-02-05

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `KnowledgePreviewDemo.jsx`, `LiveAvatarManager.jsx`, `CompanyManagement.jsx`)
- Utilities: camelCase (e.g., `videoTriggerMatcher.js`, `tokenRefresh.js`, `domainEnforcer.js`)
- Hooks: camelCase with "use" prefix (e.g., `useDemoVideo.js`, `useEventLogger.js`, `useIsMobile.js`)
- Context: PascalCase with "Context" suffix (e.g., `CompanyContext.js`, `BackendContext.js`, `NotificationContext.js`)
- CSS modules: PascalCase with `.module.css` (e.g., `ExtendedAvatarPage.module.css`)
- Config files: camelCase with `.json` or `.js` (e.g., `video-triggers.json`, `booking-config.json`, `api.js`)

**Functions:**
- camelCase consistently (e.g., `fetchAvatars`, `handleUserSpeech`, `playDemoVideo`, `validateForm`)
- Verb-first naming for action functions (e.g., `handleClick`, `removeFile`, `navigateToCreate`)
- Data fetchers prefixed with "fetch" (e.g., `fetchCompanies`, `fetchAvatars`, `fetchVoices`)
- Constants are UPPERCASE (e.g., `RENDERING_KEYWORDS`, `DEMO_KEYWORD`, `AVATARS_PER_PAGE`)

**Variables:**
- camelCase throughout (e.g., `isLoading`, `formData`, `setError`, `isInitialized`)
- Boolean variables prefixed with "is", "has", "can", or "should" (e.g., `isConnected`, `hasLiveVideo`, `canPlayWithCustomPlayer`)
- State variables use React naming: `[value, setValue]` (e.g., `const [error, setError] = useState("")`)
- Refs use Ref suffix (e.g., `avatarRef`, `videoRef`, `initializingRef`, `mountedRef`)

**Types/Objects:**
- Import destructuring from external SDKs (e.g., `{ LiveAvatarSession, SessionEvent }` from `@heygen/liveavatar-web-sdk`)
- Props objects are unnamed but documented in JSDoc (see "Comments" section)
- Configuration objects use camelCase keys (e.g., `{ qudemoId, companyName, avatarId, voiceId }`)

## Code Style

**Formatting:**
- No explicit Prettier config found; appears to use react-scripts defaults
- 2-space indentation observed throughout
- Semicolons used consistently
- Single quotes for strings (observed in JSX files, `const text = '....'`)
- Double quotes for className attributes (e.g., `className="min-h-screen bg-gray-50"`)
- Trailing commas in objects/arrays present

**Linting:**
- Tool: ESLint with React App configuration (`.eslintrc.js`)
- Config file: `/home/shaheen/work/avatar/frontend/.eslintrc.js`
- Rules disabled:
  - `no-unused-vars` - off
  - `react-hooks/exhaustive-deps` - off
  - `jsx-a11y/anchor-is-valid` - off
- Environment: browser, node, es6

## Import Organization

**Order:**
1. React imports (e.g., `import React, { useState, useEffect } from 'react'`)
2. External packages (e.g., `import { motion } from 'framer-motion'`, `import { LiveAvatarSession } from '@heygen/liveavatar-web-sdk'`)
3. Component/utility imports (e.g., `import KnowledgeDataPreview from './KnowledgeDataPreview'`)
4. Config imports (e.g., `import { getNodeApiUrl } from '../config/api'`)
5. Hook imports (e.g., `import { useCompany } from '../context/CompanyContext'`)

**Path Aliases:**
- No alias configuration detected; relative paths used throughout
- Standard relative path pattern: `import { getNodeApiUrl } from '../config/api'`

## Error Handling

**Patterns:**
- try-catch-finally blocks used consistently for async operations
- Catch blocks log errors with structured logging (see "Logging" section)
- Example from `CompanyManagement.jsx`:
  ```javascript
  try {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(getNodeApiUrl("/api/companies"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.success) {
      setCompanies(data.data);
    } else {
      setError(data.error || "Failed to fetch companies");
    }
  } catch (error) {
    setError("Network error. Please try again.");
  } finally {
    setIsLoading(false);
  }
  ```
- State-based error tracking: `const [error, setError] = useState("")`
- Promise catch chains (e.g., `.catch(err => { log('ERROR', ...) })`)
- Early returns for error conditions (e.g., `if (!response.ok) { throw new Error(...) }`)

## Logging

**Framework:** `console.*` methods with emoji prefixes and context

**Patterns:**
- Used extensively in components for development/debugging (309+ console log instances found)
- Structured logging with emojis and context:
  ```javascript
  console.log('🎬 Initializing LiveAvatar session...');
  console.log('📋 Config:', { qudemoId, companyName, avatarId, voiceId, quality });
  console.error('❌ HeyGen account lacks Interactive Avatar access');
  console.warn('⚠️ Already initializing, skipping...');
  ```
- Custom logging hook available: `useEventLogger` hook in `/home/shaheen/work/avatar/frontend/src/hooks/useEventLogger.js`
- Hook usage: `const { logs, log, clearLogs } = useEventLogger()`
- Hook logging format: `log('CATEGORY', 'message', { data })`

## Comments

**When to Comment:**
- JSDoc comments for component and function documentation (observed in `LiveAvatarManager.jsx`, `AvatarSelector.jsx`, `DocumentUpload.jsx`)
- Inline comments for complex business logic (AIDEV-NOTE comments found throughout)
- Comments explaining "why" rather than "what" (e.g., AIDEV-NOTE comments in hooks/components)

**JSDoc/TSDoc:**
- Used for component props documentation:
  ```javascript
  /**
   * LiveAvatarManager - Manages HeyGen StreamingAvatar SDK integration
   *
   * @param {object} props
   * @param {string} props.qudemoId - QuDemo ID for session creation
   * @param {string} props.companyName - Company name
   * @param {function} props.onReady - Callback when avatar is ready
   */
  ```
- Used for function documentation:
  ```javascript
  /**
   * Attempts to refresh the access token using the refresh token
   * @returns {Promise<{success: boolean, accessToken?: string, error?: string}>}
   */
  ```

**AIDEV-NOTE Comments:**
- Custom comment pattern used for AI-assisted development notes
- Found in `/home/shaheen/work/avatar/frontend/src/components/ExtendedAvatarPage.jsx`
- Example: `// AIDEV-NOTE: Fullscreen avatar page for /extended route`
- Example: `// AIDEV-NOTE: Force new widget instance on each session`

## Function Design

**Size:**
- Functions range from ~20-200 lines for component handlers
- Complex components like `AIChatWidget` have inline functions for event handling
- Utility functions are kept small (10-50 lines)

**Parameters:**
- Props objects used with destructuring (e.g., `const DocumentUpload = ({ qudemoId, companyName, onDocumentsChange })`)
- Function callbacks named with "on" prefix (e.g., `onReady`, `onStartTalking`, `onError`, `onConnectionChange`)
- Default parameters used for optional props (e.g., `quality = 'medium'`)

**Return Values:**
- Components return JSX
- Utility functions return objects with status/data structure:
  ```javascript
  return { success: false, error: 'No refresh token found' };
  ```
- Hooks return arrays of state pairs or objects with state and functions
- Async functions return Promises with JSON response data

## Module Design

**Exports:**
- Default exports for components: `export default KnowledgePreviewDemo;`
- Named exports for utilities and hooks: `export const refreshAccessToken = async () => {...}`
- Named exports for constants: `export const RENDERING_KEYWORDS = ['rendering', 'render'];`

**Barrel Files:**
- Not extensively used; imports are from individual files
- Example: `import { getNodeApiUrl } from '../config/api'` (direct import, not barrel)
- Context pattern: `export const useCompany = () => useContext(CompanyContext);` (named export with custom hook)

## Styling

**CSS Framework:** Tailwind CSS with PostCSS
- Tailwind imports: `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;` in `index.css`
- className patterns: `className="min-h-screen bg-gray-50 py-8"`, `className="text-white text-xs font-medium"`
- CSS modules co-located with components (e.g., `ExtendedAvatarPage.module.css`)
- Inline styles used sparingly: `style={{ animationDelay: '0ms' }}`

## React Patterns

**Hooks Usage:**
- 697+ instances of hook usage found in codebase
- Common hooks: `useState`, `useEffect`, `useCallback`, `useContext`, `useRef`
- Example pattern:
  ```javascript
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    if (enabled) {
      fetchAvatars();
    }
  }, [enabled]);
  ```

**Context Pattern:**
- Used for shared state (e.g., `CompanyContext`, `NotificationContext`, `BackendContext`)
- Implementation pattern:
  ```javascript
  const CompanyContext = createContext();
  export const useCompany = () => useContext(CompanyContext);
  export const CompanyProvider = ({ children }) => {
    // ... provider logic
  };
  ```

**Component Composition:**
- Props passed down from parent to child
- Callbacks for child-to-parent communication
- Example: `<DocumentUpload onDocumentsChange={handleDocuments} onSelectedFilesChange={handleFiles} />`

---

*Convention analysis: 2026-02-05*
