# Technology Stack

**Analysis Date:** 2026-02-05

## Languages

**Primary:**
- JavaScript (ES6+) - React components, utilities, configuration
- JSX - React component markup in `src/components/`, `src/v2-avatar/components/`, `src/mobile/components/`
- ES Modules (`.mjs`) - Vercel serverless functions in `api/` directory

**Runtime:**
- Node.js v24.11.1 (current development)
- Browser APIs - WebRTC, MediaStream, Web Audio API for avatar communications

## Runtime & Package Management

**Environment:**
- Node.js v24.11.1
- npm v11.6.2

**Package Manager:**
- npm - Lockfile: `package-lock.json` (present, 762,966 bytes)
- Dependencies: 31 direct dependencies

## Frameworks & Core Libraries

**Frontend Framework:**
- React 19.1.0 - UI library with hooks
- React DOM 19.1.0 - DOM rendering
- React Router DOM 6.30.0 - Client-side routing (SPA navigation)

**Styling:**
- Tailwind CSS 4.1.7 - Utility-first CSS framework
- Tailwind PostCSS Plugin 4.1.7 - CSS processing
- PostCSS 8.5.3 - CSS transformation pipeline
- Autoprefixer 10.4.21 - Vendor prefixing
- Tailwind Merge 3.3.1 - Merge Tailwind class conflicts

**Build & Development:**
- React Scripts 5.0.1 - Create React App build toolchain
- Express 5.1.0 - Local dev server for API routes (`dev-server.mjs`)
- CORS 2.8.5 - Cross-origin request handling
- dotenv 17.2.3 - Environment variable loading

## Video & Streaming

**Avatar Platforms:**
- @heygen/liveavatar-web-sdk 0.0.9 - HeyGen Interactive Avatar SDK
- livekit-client 2.16.0 - LiveKit WebRTC client (for HeyGen avatars)
- @daily-co/daily-js 0.56.0 - Daily.co video SDK (for Tavus avatars)

**Video Players & Media:**
- video.js 8.23.4 - HTML5 video player
- videojs-youtube 3.0.1 - YouTube plugin for video.js
- react-player 2.16.0 - React video player component
- pdfjs-dist 5.4.530 - PDF rendering (for document handling in presentations)
- react-pdf 10.3.0 - React wrapper for PDF.js

## Data & Validation

**Database Client:**
- @supabase/supabase-js 2.57.4 - Supabase PostgreSQL client with auth

**Data Validation:**
- ajv 8.12.0 - JSON schema validator (for request/response validation)
- ajv-keywords 5.1.0 - Extended AJV keywords

**HTTP Client:**
- axios 1.9.0 - Promise-based HTTP client (for API calls)

## Data Visualization & Processing

**Charts:**
- recharts 2.15.3 - React charting library (for analytics/dashboards)

**Spreadsheet:**
- xlsx 0.18.5 - Excel file parsing and generation (for data exports)

**3D Graphics:**
- ogl 1.0.11 - Minimal WebGL library (possibly for 3D avatar rendering)

## UI Components & Icons

**Icons:**
- @heroicons/react 2.2.0 - Heroicons icon set (outline/solid variants)
- lucide-react 0.511.0 - Lucide icon library
- react-icons 5.5.0 - Unified icon library (Font Awesome, Feather, etc.)

**Motion & Animation:**
- framer-motion 12.23.24 - React animation library

**Utilities:**
- clsx 2.1.1 - Conditional CSS class builder
- react-intersection-observer 9.16.0 - Lazy loading/visibility detection

## Configuration

**Environment Variables:**
- `.env.local` - Development credentials (HeyGen API key, avatar ID, voice ID, Tavus credentials)
- `.env.production` - Production environment variables (Vercel deployment)
- `.env.production` file contains placeholders: HEYGEN_API_KEY, HEYGEN_AVATAR_ID, HEYGEN_VOICE_ID

**Build Configuration:**
- `tailwind.config.js` - Tailwind CSS customization (custom colors: primary, meta, success, danger, warning, etc.)
- `postcss.config.js` - PostCSS plugins (Tailwind, Autoprefixer)
- `vercel.json` - Vercel deployment config with SPA rewrite rules

**ESLint Configuration:**
- `.eslintrc.js` - Extends `react-app` with customized rules (disabled: no-unused-vars, react-hooks/exhaustive-deps, jsx-a11y/anchor-is-valid)

## Deployment & Hosting

**Production Hosting:**
- Vercel - Serverless functions platform (`api/` directory for function routes)
- Vercel Functions - Node.js serverless handlers for API routes

**CI/CD:**
- Not detected (likely handled by Vercel git integration)

## Platform Requirements

**Development:**
- Node.js v24.11.1+
- npm v11.6.2+
- Modern browser with WebRTC support (Chrome, Firefox, Safari)
- Microphone/webcam access for avatar interactions

**Production:**
- Vercel platform (serverless)
- Modern browser with WebRTC support
- Network bandwidth for video streaming (Daily.co and LiveKit)

## Key Dependencies by Purpose

**Critical - Avatar Streaming:**
- `@daily-co/daily-js` - Daily.co video infrastructure (Tavus)
- `livekit-client` - LiveKit WebRTC (HeyGen)
- `@heygen/liveavatar-web-sdk` - HeyGen SDK integration

**Critical - Backend:**
- `@supabase/supabase-js` - Authentication and database

**Build & Development:**
- `react-scripts` - Create React App build system
- `express` + `cors` - Local development API server
- `dotenv` - Environment variable management

**Styling & UI:**
- `tailwindcss` + `autoprefixer` + `postcss` - CSS pipeline
- Icon libraries - UI components
- `framer-motion` - Animations

## Lock Files

- `package-lock.json` - npm v9 format lock file (automatic npm v5.4.2+ compatibility)

---

*Stack analysis: 2026-02-05*
