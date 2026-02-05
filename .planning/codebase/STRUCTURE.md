# Codebase Structure

**Analysis Date:** 2026-02-05

## Directory Layout

```
frontend/
├── src/                        # Main React application source
│   ├── components/             # 76 React components (UI and page-level)
│   │   └── ui/                 # 16 reusable UI component primitives
│   ├── context/                # 3 Context providers (Company, Backend, Notifications)
│   ├── hooks/                  # 4 custom React hooks
│   ├── config/                 # Configuration files (API, Supabase, video triggers)
│   ├── utils/                  # Utility functions (token, domain, navigation)
│   ├── mobile/                 # Mobile-specific implementation
│   │   ├── components/         # Mobile components
│   │   ├── hooks/              # Mobile custom hooks
│   │   ├── utils/              # Mobile utilities
│   │   └── config/             # Mobile configuration
│   ├── v2-avatar/              # Tavus avatar integration (v2)
│   │   ├── components/         # Avatar page and widget components
│   │   ├── hooks/              # Avatar-specific hooks
│   │   ├── personas/           # Persona configuration
│   │   └── utils/              # Avatar utilities
│   ├── lib/                    # Library utilities
│   ├── index.js                # React DOM entry point
│   ├── App.js                  # Main application component with routing
│   ├── App.css                 # Application global styles
│   └── index.css               # Base Tailwind and global styles
├── api/                        # Serverless API functions (Vercel)
│   ├── create-liveavatar-session.mjs
│   ├── liveavatar/             # LiveAvatar SDK integration
│   └── tavus/                  # Tavus SDK integration
├── public/                     # Static assets
├── build/                      # Build output directory
├── scripts/                    # Build and deployment scripts
├── .planning/                  # GSD planning documentation
├── legacy/                     # Old codebase (not in active use)
├── node_modules/               # Dependencies
├── package.json                # Project dependencies
├── package-lock.json           # Locked dependency versions
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── .eslintrc.js                # ESLint configuration
├── .env.local                  # Local environment variables
├── .env.production             # Production environment variables
├── vercel.json                 # Vercel deployment configuration
└── dev-server.mjs              # Local development server setup

legacy/                        # Legacy Next.js codebase (deprecated)
├── pages/
├── components/
└── ...
```

## Directory Purposes

**src/components/:**
- Purpose: All React components (page-level and reusable UI)
- Contains: 76 `.jsx` files including full pages, modals, widgets, and UI primitives
- Key files: `HomePage.jsx`, `CreateQudemoTwoStep.jsx`, `Qudemos.jsx`, `AIChatWidget.jsx` (100KB)
- Pattern: Named exports, functional components with hooks

**src/components/ui/:**
- Purpose: Reusable UI primitives and animated elements
- Contains: 16 components like `LightRays.jsx`, `FramerCard.jsx`, `PricingCard.jsx`
- Pattern: Zero-dependency visual components, Framer Motion animations
- Examples: `AnimatedLightRays.jsx`, `RadarScanner.jsx`, `SpotlightCard.jsx`

**src/context/:**
- Purpose: Global state management via React Context API
- Contains: Three context providers with custom hooks
- `CompanyContext.js`: Company data, loading state, refresh methods, auth verification
- `BackendContext.js`: Selected backend (for testing), backend switching logic
- `NotificationContext.js`: Toast/alert notification system

**src/hooks/:**
- Purpose: Reusable logic extracted as custom hooks
- `useDemoVideo.js`: Demo video playback with PIP and microphone control
- `useIsMobile.js`: Mobile device detection via window size
- `useEventLogger.js`: Event logging utility
- `usePreventRefresh.js`: Prevent accidental page refresh

**src/config/:**
- Purpose: Configuration and environment setup
- `api.js`: API endpoints, URL resolution, helper functions for Node and Python APIs
- `supabase.js`: Supabase client initialization
- `video-triggers.json`: Keyword-based video trigger mappings for demos
- `booking-config.json`: Calendly booking link

**src/utils/:**
- Purpose: Utility functions for cross-cutting concerns
- `tokenRefresh.js`: JWT token refresh, authenticated fetch wrapper, session cleanup
- `domainEnforcer.js`: Domain validation and redirect logic
- `navigation.js`: Route navigation helpers
- `videoUrlProcessor.js`: Video URL parsing and processing
- `videoTriggerMatcher.js`: Match conversation keywords to demo videos
- `serviceWorkerRegistration.js`: Service worker setup

**src/mobile/:**
- Purpose: Mobile-optimized user experience
- `MobileLandingPage.jsx`: Mobile landing page (86KB, lazy-loaded)
- `mobile/utils/`: Mobile-specific utilities
- `mobile/hooks/`: Mobile-specific hooks
- `mobile/config/`: Mobile configuration (separate video triggers)
- Pattern: Same context providers and auth as desktop, different UI

**src/v2-avatar/:**
- Purpose: Tavus avatar integration (v2 implementation)
- `components/TavusAvatarWidget.jsx`: Main avatar widget (235KB)
- `components/TavusAvatarPage.jsx`: Avatar page wrapper
- `components/PdfPresentation.jsx`: PDF presentation integration
- `components/MCQQuizOverlay.jsx`: Quiz interaction overlay
- `hooks/`: Avatar-specific hooks
- `personas/`: Persona configuration files
- `utils/`: Avatar utilities and helpers

**api/:**
- Purpose: Serverless backend functions for secure SDK integrations
- `create-liveavatar-session.mjs`: Create HeyGen LiveAvatar session with secure token
- `tavus/`: Tavus-specific API endpoints
- `liveavatar/`: HeyGen LiveAvatar API endpoints
- Pattern: Node.js serverless functions, environment variable access

**src/lib/:**
- Purpose: Library and utility modules
- Currently sparse, reserved for future library code

## Key File Locations

**Entry Points:**
- `src/index.js`: React DOM render, wraps App
- `src/App.js`: Router setup, Provider wrapping, route definitions, ProtectedRoute/CompanyCheck components

**Configuration:**
- `src/config/api.js`: All API endpoints and URL construction
- `.env.local`: Local environment (REACT_APP_NODE_API_URL, REACT_APP_PYTHON_API_URL)
- `.env.production`: Production environment secrets
- `tailwind.config.js`: Tailwind CSS theme and plugins

**Core Logic:**
- `src/context/CompanyContext.js`: Company state, company fetch, retry logic
- `src/utils/tokenRefresh.js`: Token lifecycle, authenticated requests
- `src/components/CreateQudemoTwoStep.jsx`: Main demo creation workflow (65KB)
- `src/components/Qudemos.jsx`: Dashboard, demo list, interactions (170KB)

**Authentication:**
- `src/components/LoginPage.jsx`: User login form and auth
- `src/components/RegisterPage.jsx`: User registration
- `src/components/AuthCallback.jsx`: OAuth callback handler
- `src/components/AuthenticatedQAAnalytics.jsx`: Protected analytics view

**Avatar Features:**
- `src/components/LiveAvatarManager.jsx`: HeyGen LiveAvatar session management
- `src/components/AvatarSelector.jsx`: Avatar selection UI
- `src/components/CustomVideoPlayer.jsx`: Video playback wrapper
- `src/v2-avatar/components/TavusAvatarWidget.jsx`: Tavus avatar implementation

**Testing/Utilities:**
- `src/components/TestRunner.jsx`: Test runner for development
- `dev-server.mjs`: Local development server with Express

## Naming Conventions

**Files:**
- Components: `PascalCase.jsx` (e.g., `HomePage.jsx`, `CreateQudemoTwoStep.jsx`)
- Utilities: `camelCase.js` (e.g., `tokenRefresh.js`, `domainEnforcer.js`)
- Hooks: `camelCase.js` prefixed with `use` (e.g., `useDemoVideo.js`, `useIsMobile.js`)
- Styles: `PascalCase.css` or `.module.css` (e.g., `ExtendedAvatarPage.module.css`)
- Config: `kebab-case.js` or `.json` (e.g., `booking-config.json`, `video-triggers.json`)

**Directories:**
- Feature directories: `camelCase` (e.g., `components`, `mobile`, `v2-avatar`)
- Grouping directories: `kebab-case` or `camelCase` (e.g., `ui`, `config`, `hooks`)

**Component Props:**
- camelCase for all props (e.g., `onClose`, `qudemoId`, `isLoading`)

**Functions:**
- camelCase for function names (e.g., `handleVoicePreview`, `createQudemo`)
- Use verb prefixes: `handle*` for event handlers, `get*` for accessors, `set*` for state updates

**Variables:**
- camelCase for all variables and constants
- UPPER_CASE for environment variables (e.g., `REACT_APP_NODE_API_URL`)

## Where to Add New Code

**New Feature (e.g., Reports Page):**
- Primary code: `src/components/ReportsPage.jsx`
- Context if needed: `src/context/ReportsContext.js` (if shared state needed)
- Hooks if needed: `src/hooks/useReports.js`
- API calls: Use existing `config/api.js` or add endpoints there
- Tests: `src/components/ReportsPage.test.js` (if test infrastructure added)

**New Component/Module:**
- Reusable component: `src/components/ComponentName.jsx`
- UI primitive: `src/components/ui/ComponentName.jsx`
- Page component: `src/components/PageName.jsx` (contains routing logic)
- Helper component: `src/components/HelperComponent.jsx` (supporting component)

**New Custom Hook:**
- Implementation: `src/hooks/useHookName.js`
- Export from component or use directly in component

**New Utility Function:**
- General utility: `src/utils/helperName.js`
- Mobile-specific: `src/mobile/utils/mobileHelperName.js`
- Avatar-specific: `src/v2-avatar/utils/avatarHelperName.js`

**New API Endpoint:**
- Add to `src/config/api.js` in appropriate section (node, python, video)
- Call via `getNodeApiUrl()`, `getVideoApiUrl()`, or direct base URL

**New Context:**
- Implementation: `src/context/NewContext.js`
- Provider + custom hook both exported
- Wrap routes in App.js that need this context
- Use in components via `useNewContext()` hook

**New Mobile Feature:**
- Implement in `src/mobile/` mirroring `src/` structure
- Update `MobileLandingPage.jsx` or create new mobile page
- Desktop version can remain in `src/components/`

**New Avatar Integration:**
- Component: `src/v2-avatar/components/IntegrationName.jsx`
- Hooks: `src/v2-avatar/hooks/useIntegrationName.js`
- Utils: `src/v2-avatar/utils/integrationHelpers.js`
- API: `api/integration-endpoint.mjs` for secure token generation

## Special Directories

**build/:**
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (by npm install)
- Committed: No (in .gitignore)

**.planning/codebase/:**
- Purpose: GSD codebase documentation
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md
- Generated: No (manually maintained by GSD tools)
- Committed: Yes

**legacy/:**
- Purpose: Old Next.js codebase (deprecated, not maintained)
- Status: Archive only
- Committed: Yes (for historical reference)

**.claude/:**
- Purpose: Claude Code session artifacts
- Generated: Yes
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-02-05*
