# Testing Patterns

**Analysis Date:** 2026-02-05

## Test Framework

**Runner:**
- React Scripts 5.0.1 (built-in Jest configuration)
- No standalone Jest config file found
- Test configuration inherited from `react-scripts` package

**Assertion Library:**
- Not detected - likely using Jest's built-in matchers (as react-scripts includes Jest with chai/expect)

**Run Commands:**
```bash
npm test                  # Run tests (via react-scripts)
npm run build            # Production build with testing
npm start                # Development with hot reload
```

**Testing Status:**
- **No test files found** in `/home/shaheen/work/avatar/frontend/src/`
- No `.test.js`, `.spec.js`, or `__tests__` directories
- Testing framework configured but not actively used

## Test File Organization

**Location:**
- Test files should be co-located with source files
- Convention would be: `ComponentName.jsx` with `ComponentName.test.jsx` or `ComponentName.spec.jsx`
- Current structure: Not applicable (no tests exist)

**Naming:**
- Expected pattern: `ComponentName.test.jsx` (based on Jest convention)
- Alternative: `ComponentName.spec.jsx`

**Structure:**
- Would follow Jest/React Testing Library patterns if implemented
- Currently unused

## Test Structure

**Suite Organization:**
- Not implemented in current codebase
- Recommended pattern (typical for React Testing Library):
```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  describe('User Interactions', () => {
    test('should handle click events', () => {
      // test implementation
    });
  });

  describe('State Management', () => {
    test('should update state when form changes', () => {
      // test implementation
    });
  });

  describe('API Integration', () => {
    test('should fetch data on mount', () => {
      // test implementation
    });
  });
});
```

**Patterns:**
- Setup pattern: Not established
- Teardown pattern: Not established
- Assertion pattern: Not established

## Mocking

**Framework:**
- Jest mock system (built into react-scripts)
- Fetch API mocking recommended for API calls

**Patterns:**
- Not implemented in codebase
- Recommendation for mocking:
```javascript
// Mock fetch calls
global.fetch = jest.fn();

// Mock context providers
jest.mock('../context/CompanyContext', () => ({
  useCompany: jest.fn(),
}));

// Mock external SDKs
jest.mock('@heygen/liveavatar-web-sdk', () => ({
  LiveAvatarSession: jest.fn(),
  SessionEvent: { STREAM_READY: 'stream-ready' },
}));
```

**What to Mock:**
- External API calls (fetch requests to Node/Python backends)
- External SDKs (`@heygen/liveavatar-web-sdk`, `livekit-client`, `@daily-co/daily-js`)
- Context providers
- localStorage operations
- window.location operations

**What NOT to Mock:**
- React built-in hooks (useState, useEffect, useCallback, useRef)
- Utility functions (videoTriggerMatcher, tokenRefresh, navigation)
- Component state management
- CSS and styling

## Fixtures and Factories

**Test Data:**
- Not implemented
- Recommendation for test fixtures:
```javascript
// Example fixture for AvatarSelector tests
const mockAvatarData = {
  success: true,
  avatars: [
    { id: 'avatar-1', name: 'Avatar One', preview_url: 'https://...' },
    { id: 'avatar-2', name: 'Avatar Two', preview_url: 'https://...' },
  ]
};

const mockVoiceData = {
  success: true,
  voices: [
    { id: 'voice-1', name: 'Voice One', language: 'English (US)' },
    { id: 'voice-2', name: 'Voice Two', language: 'English (UK)' },
  ]
};

// Example fixture for CompanyManagement tests
const mockCompanyResponse = {
  success: true,
  data: [
    {
      id: 'company-1',
      name: 'Test Company',
      description: 'A test company',
      website: 'https://example.com',
      logo: 'https://example.com/logo.png'
    }
  ]
};
```

**Location:**
- Should be created in `src/__fixtures__/` or alongside test files
- Currently not used

## Coverage

**Requirements:**
- Not enforced (no coverage threshold configuration found)
- No minimum coverage requirements specified

**View Coverage:**
```bash
npm test -- --coverage
```

## Test Types

**Unit Tests:**
- **Scope:** Individual functions and components
- **Approach:** Test utility functions (`tokenRefresh`, `videoTriggerMatcher`, `navigation`) in isolation
- **Example targets:**
  - `refreshAccessToken()` - token refresh logic
  - `checkForDemoTrigger()` - demo trigger detection
  - `validateForm()` - form validation in CompanyManagement
  - Form validation in DocumentUpload

**Integration Tests:**
- **Scope:** Component + hooks + context interaction
- **Approach:** Test components with their data fetching and state management
- **Example targets:**
  - `CompanyManagement` with `useCompany` context
  - `DocumentUpload` with file upload flow
  - `AvatarSelector` with API calls and selection
  - `AIChatWidget` with LiveKit room and avatar session
  - Context providers: `CompanyProvider`, `NotificationProvider`, `BackendProvider`

**E2E Tests:**
- **Framework:** Not currently used
- **Recommendation:** Playwright or Cypress for full user flows
- **Example scenarios:**
  - Complete login/registration flow
  - Creating and managing a QuDemo
  - Uploading documents and triggering analysis
  - Avatar interaction session (LiveAvatar + LiveKit)
  - Booking appointment through Calendly widget

## Common Patterns to Test

**Async Testing:**
- Document processing with loading states
- API calls with success/error scenarios
- Avatar session initialization with token creation

```javascript
// Recommended pattern for async tests
test('should fetch companies on mount', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [{ id: '1', name: 'Company' }]
      })
    })
  );

  const { getByText } = render(<CompanyManagement />);

  await waitFor(() => {
    expect(getByText(/Company/i)).toBeInTheDocument();
  });
});
```

**Error Testing:**
- API failures (network errors, auth errors)
- Form validation errors
- File upload errors

```javascript
// Recommended pattern for error handling tests
test('should display error message on API failure', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: 'Failed to fetch companies'
      })
    })
  );

  const { getByText } = render(<CompanyManagement />);

  await waitFor(() => {
    expect(getByText(/Failed to fetch/i)).toBeInTheDocument();
  });
});
```

**State Management Testing:**
- useState updates
- useCallback memoization
- useEffect dependencies

```javascript
// Recommended pattern for state tests
test('should update form data when input changes', async () => {
  const { getByLabelText } = render(<CompanyManagement />);
  const input = getByLabelText(/Company name/i);

  await userEvent.type(input, 'New Company');

  expect(input.value).toBe('New Company');
});
```

## Key Testing Areas (No Tests Currently)

**High Priority - Critical Flows:**
1. **Authentication & Token Refresh** (`tokenRefresh.js`)
   - `refreshAccessToken()` - token refresh on 401/403
   - `authenticatedFetch()` - automatic retry logic
   - `clearAuthTokens()` - logout/token cleanup

2. **API Integration** (Multiple components)
   - `CompanyManagement` - company CRUD operations
   - `DocumentUpload` - file upload with sequential handling
   - `AvatarSelector` - avatar/voice fetching and pagination

3. **Avatar Session Management** (`LiveAvatarManager.jsx`, `AIChatWidget.jsx`)
   - Session initialization and cleanup
   - Event handling (start/stop talking, stream disconnect)
   - Error recovery and reconnection logic

4. **Form Validation** (`CompanyManagement.jsx`, `DocumentUpload.jsx`)
   - Validation rules enforcement
   - Error state management
   - Form reset after submission

5. **WebRTC/LiveKit Integration** (`AIChatWidget.jsx`)
   - Room creation and connection
   - Audio track management
   - Participant detection and state tracking

**Medium Priority:**
- Intent detection (`checkForDemoTrigger` in utils)
- Video URL processing and type detection
- Domain enforcement and navigation
- Demo video playback control

**Lower Priority:**
- UI animations and interactions
- Analytics logging
- Mobile responsive behavior

## Development Testing Practices

**Manual Testing Focus:**
- Components tested via `npm start` development server
- Browser DevTools used for debugging (evident from console.log statements)
- Event logging hook (`useEventLogger`) used for runtime debugging

**Debugging Tools Available:**
- Custom logging hook in `/home/shaheen/work/avatar/frontend/src/hooks/useEventLogger.js`
- Console logging with structured format (emoji prefixes + context)
- localStorage inspection for token/auth debugging

---

*Testing analysis: 2026-02-05*
