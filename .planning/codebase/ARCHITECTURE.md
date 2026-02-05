# Architecture

**Analysis Date:** 2026-02-05

## Pattern Overview

**Overall:** React SPA with Context-based state management and multi-backend architecture

**Key Characteristics:**
- React 19 Single Page Application with React Router v6 for client-side routing
- Context API for global state (Company, Backend, Notifications)
- Token-based authentication with JWT refresh token flow
- Multi-API architecture: Node.js backend for auth/core + Python backends for video processing
- Component-driven UI with Tailwind CSS styling
- Lazy loading and code splitting for performance optimization
- Specialized avatar integration (HeyGen, LiveAvatar, Tavus)

## Layers

**Presentation Layer (Components):**
- Purpose: User interface rendering and interaction handling
- Location: `src/components/` (76 components)
- Contains: React functional components using hooks, UI elements, form handlers
- Depends on: Context API, Custom hooks, Config, Utils
- Used by: Router in App.js

**State Management Layer (Context):**
- Purpose: Global state management for authentication, company data, backend selection, notifications
- Location: `src/context/`
- Contains: `CompanyContext.js`, `BackendContext.js`, `NotificationContext.js`
- Depends on: API configuration, Token refresh utilities
- Used by: All protected components requiring company/auth data

**Custom Hooks Layer:**
- Purpose: Reusable logic for video handling, mobile detection, event logging
- Location: `src/hooks/`
- Contains: `useDemoVideo.js`, `useIsMobile.js`, `useEventLogger.js`, `usePreventRefresh.js`
- Depends on: React hooks, Config
- Used by: Various components for isolated concerns

**API Configuration Layer:**
- Purpose: Centralize API endpoints and URL management for multiple backends
- Location: `src/config/api.js`
- Contains: Environment-based URL resolution, endpoint constants, helper functions
- Depends on: Environment variables
- Used by: All components making API calls

**Authentication & Token Layer:**
- Purpose: Handle JWT token lifecycle and authenticated requests
- Location: `src/utils/tokenRefresh.js`
- Contains: Token refresh logic, authenticated fetch wrapper, session cleanup
- Depends on: API configuration, Supabase client
- Used by: Protected routes, Context providers, API-calling components

**Utilities Layer:**
- Purpose: Cross-cutting concerns like navigation, video processing, domain enforcement
- Location: `src/utils/`
- Contains: Navigation helpers, video trigger matching, token management, domain redirects
- Used by: Components, hooks, and main App

**Mobile Experience Layer:**
- Purpose: Separate optimized experience for mobile devices
- Location: `src/mobile/`
- Contains: `MobileLandingPage.jsx`, mobile-specific hooks and utils
- Depends on: Same context and API as desktop
- Used by: Conditional rendering in HomeRoute and App

**Avatar Integrations Layer:**
- Purpose: Encapsulate third-party avatar SDKs (HeyGen, LiveAvatar, Tavus)
- Location: `src/components/` (LiveAvatarManager.jsx, AvatarSelector.jsx) and `src/v2-avatar/`
- Contains: Avatar session management, video generation, persona handling
- Depends on: External SDKs (@heygen/liveavatar-web-sdk, etc.)
- Used by: Interactive video components

**Serverless API Layer:**
- Purpose: Vercel serverless functions for live avatar session creation
- Location: `api/` (Node.js/ESM functions)
- Contains: `create-liveavatar-session.mjs`, Tavus and LiveAvatar integrations
- Used by: Frontend avatar components for secure session token generation

## Data Flow

**Authentication Flow:**

1. User submits login credentials on LoginPage
2. Credentials sent to Node API (`/api/auth/login`)
3. Node API returns `{accessToken, refreshToken, user}` stored in localStorage
4. On protected route access, ProtectedRoute checks localStorage tokens
5. If token invalid/expired, `tokenRefresh.js` calls `/api/auth/refresh` endpoint
6. New token stored, request retried with fresh token
7. CompanyContext fetches company data with authenticated token
8. CompanyProvider listens to storage events for token updates via `authCompleted` event

**Qudemo Creation Flow:**

1. User navigates to `/create` → CreateQudemoTwoStep component loads
2. Step 1: User uploads documents/videos, system generates FAQs via Python API
3. Step 1: User selects avatar, voice, and collects user info preferences
4. Step 2: System generates videos via Python API (`/process-video`)
5. Qudemo data POSTed to Node API (`/api/qudemos`) with all configuration
6. On success, system stores demo ID and redirects to dashboard
7. CompanyContext refreshes to update company state

**Video Generation & Avatar Integration:**

1. CreateQudemoTwoStep or related components initiate video generation
2. Python API receives request with content, avatar ID, voice selection
3. Avatar SDK (HeyGen/Tavus/LiveAvatar) called via backend
4. Generated video URLs returned and stored in qudemo record
5. Frontend fetches videos via HybridVideoPlayer for playback
6. Interactive avatars use LiveAvatarManager for real-time rendering

**Backend Selection Flow:**

1. BackendContext maintains selected backend state in localStorage
2. Components read `pythonApiUrl` from BackendContext
3. User can switch backends via UI (for testing/debugging)
4. Analytics event logged on backend switch
5. All subsequent Python API calls use selected backend URL

**State Management:**

- **Authentication**: localStorage (accessToken, refreshToken, user) + ProtectedRoute checks
- **Company Data**: CompanyContext with retry logic and storage event listeners
- **Backend Selection**: BackendContext with localStorage persistence
- **Notifications**: NotificationContext for toast/alert display
- **Component State**: Individual component useState for UI state (modals, forms, loading states)

## Key Abstractions

**ProtectedRoute:**
- Purpose: Guard routes requiring authentication
- Examples: `/overview`, `/create`, `/dashboard/*`
- Pattern: Checks localStorage token, attempts refresh on 401, redirects to login if invalid

**CompanyCheck:**
- Purpose: Ensure authenticated user has company data before accessing dashboard
- Pattern: Wraps ProtectedRoute, shows CompanySetup if company is null
- Used by: All dashboard routes

**DashboardLayout:**
- Purpose: Provide consistent layout (sidebar + header + content) for authenticated pages
- Pattern: Renders Sidebar, Header, and main content area with overflow handling
- Contains: Welcome preview modal logic for new users

**Lazy Loading Components:**
- Pattern: React.lazy() + Suspense for code splitting
- Examples: MobileLandingPage, QudemoPreview
- Purpose: Reduce initial bundle size, load features on demand

**Modal/Overlay Pattern:**
- Pattern: State-driven visibility with conditional rendering
- Examples: CustomFAQModal, VideoGenerationProgress, WidgetGeneratorModal
- Typical: Show state → onClose handler → state update

## Entry Points

**Main App:**
- Location: `src/index.js` → `src/App.js`
- Triggers: Application startup via `npm start`
- Responsibilities: Router setup, Provider wrapping, global routes, authentication logic

**Public Routes:**
- `/` (HomeRoute) → HomePage or MobileLandingPage
- `/login` → LoginPage
- `/register` → RegisterPage
- `/share/:shareToken` → PublicQudemoShare
- `/v2-avatar/:personaId` → TavusAvatarPage

**Protected Routes (Auth + Company Required):**
- `/overview` → OverviewPage
- `/create` → CreateQudemoTwoStep
- `/qudemos` → Qudemos
- `/settings` → SettingsPage
- `/interactions` → CustomerInteractionsPage
- `/analytics` → InsightsAnalytics

**API Entry Point (Serverless):**
- `api/create-liveavatar-session.mjs` - Session token generation
- `api/tavus/*` - Tavus avatar endpoints
- `api/liveavatar/*` - LiveAvatar endpoints

## Error Handling

**Strategy:** Try-catch blocks with user-friendly notifications, fallback to localStorage state

**Patterns:**

- **Authentication Errors**: `ProtectedRoute` catches 401/403, triggers token refresh, logs user out on persistent failure
- **API Errors**: Components catch fetch errors, display via `useNotification` context
- **Video Generation**: `VideoGenerationProgress` tracks status polling, shows progress or error message
- **Company Data**: `CompanyContext` retries after 1s delay on no-company scenario
- **Silent Failures**: Some async operations fail silently (e.g., demo video playback) with console logs only
- **Validation**: Form inputs validated before submission, URL validation with popup warnings

## Cross-Cutting Concerns

**Logging:**
- `useEventLogger` hook for tracking user actions
- Console logging throughout for debugging
- Demo video playback has detailed lifecycle logging in `useDemoVideo`

**Validation:**
- URL validation in CreateQudemoTwoStep with error tracking
- Form field validation on submit
- Video URL processing via `videoUrlProcessor.js`

**Authentication:**
- Global token refresh via `authenticatedFetch` wrapper
- StorageEvent listener in CompanyContext for cross-tab auth sync
- Custom `authCompleted` event for login completion signals

**Responsive Design:**
- `useIsMobile` hook for device detection
- Conditional rendering for mobile vs desktop (MobileLandingPage vs HomePage)
- Tailwind responsive classes throughout components

**Video Handling:**
- `useDemoVideo` for demo video playback with PIP integration
- HybridVideoPlayer for multi-format video support
- Video trigger matching for company-specific demo videos

---

*Architecture analysis: 2026-02-05*
