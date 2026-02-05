# HeyGen Removal & Codebase Cleanup

## What This Is

Cleanup project to remove all HeyGen and LiveKit code from the avatar frontend. The product is consolidating exclusively on Tavus for avatar functionality, making HeyGen/LiveKit integrations dead code that needs removal.

## Core Value

Remove HeyGen/LiveKit code completely without breaking the landing page or Tavus (v2-avatar) functionality.

## Requirements

### Validated

<!-- Existing functionality that must continue working -->

- ✓ Tavus avatar integration in v2-avatar/ — existing, DO NOT TOUCH
- ✓ Landing/home page renders correctly — existing
- ✓ Authentication flow (Supabase) — existing
- ✓ Dashboard and Qudemo management — existing
- ✓ Company management — existing

### Active

<!-- Cleanup tasks for this project -->

- [ ] Remove HeyGen SDK components (LiveAvatarManager.jsx, AIChatWidget.jsx)
- [ ] Remove FloatingQudemoWidget.jsx and related code
- [ ] Remove api/liveavatar/ serverless functions
- [ ] Remove mobile HeyGen/LiveKit code (MobileAvatarWidget, LiveKit utils)
- [ ] Remove @heygen/liveavatar-web-sdk npm package
- [ ] Remove livekit-client npm package
- [ ] Clean up any orphaned imports/references
- [ ] App builds without errors
- [ ] App runs without runtime errors

### Out of Scope

- Modifying v2-avatar/ folder — active Tavus development, don't touch
- Refactoring remaining code — just remove, don't improve
- Adding new features — cleanup only
- Updating other npm packages — only remove HeyGen/LiveKit deps

## Context

**Current state:**
- Dual avatar system: HeyGen (via LiveKit) and Tavus (via Daily.co)
- HeyGen widget is already hidden on homepage
- v2-avatar/ contains all active Tavus development
- Multiple large components to remove (2000-3000+ lines each)

**Technical environment:**
- React 19 SPA with React Router v6
- Tailwind CSS for styling
- Vercel for deployment (serverless functions in api/)
- Supabase for auth

**Files to remove:**
- `src/components/LiveAvatarManager.jsx`
- `src/components/AIChatWidget.jsx`
- `src/components/FloatingQudemoWidget.jsx`
- `src/mobile/components/MobileAvatarWidget.jsx`
- `src/mobile/utils/LiveKitEventManager.js` (and related)
- `api/liveavatar/` folder

**Packages to remove:**
- @heygen/liveavatar-web-sdk
- livekit-client

## Constraints

- **Preservation**: v2-avatar/ folder must not be modified
- **Functionality**: Landing page and Tavus routes must continue working
- **Testing**: App must build and run without errors after cleanup

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Remove HeyGen entirely | Consolidating on Tavus only | — Pending |
| Clean mobile code too | Same consolidation applies | — Pending |
| Remove npm packages | Clean dependency tree | — Pending |

---
*Last updated: 2026-02-05 after initialization*
