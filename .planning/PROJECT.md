# Avatar Frontend

## What This Is

React-based avatar frontend application with Tavus CVI integration. Previously supported both HeyGen/LiveKit and Tavus avatar systems; now runs exclusively on Tavus after v1.0 cleanup.

## Core Value

Flexible, multi-tenant course delivery platform powered by Tavus CVI with JSON-based content loading.

## Current State (v1.1 In Progress)

**Shipped:** 2026-02-05
**Codebase:** ~44,000 LOC (JavaScript/JSX)
**Tech stack:** React 19, React Router v6, Tailwind CSS, Vercel, Supabase

**v1.0 removed:**
- @heygen/liveavatar-web-sdk npm package
- livekit-client npm package
- Desktop HeyGen components (LiveAvatarManager, AIChatWidget, FloatingQudemoWidget)
- Mobile HeyGen components (MobileAvatarWidget, LiveKit utils)
- api/liveavatar/ serverless endpoints

**v1.0 preserved:**
- Landing page (desktop and mobile)
- Tavus avatar integration (v2-avatar/)
- Authentication flow (Supabase)
- Dashboard and Qudemo management
- Company management

## Requirements

### Validated

- [x] COMP-01: Remove LiveAvatarManager.jsx and all imports — v1.0
- [x] COMP-02: Remove AIChatWidget.jsx and all imports — v1.0
- [x] COMP-03: Remove FloatingQudemoWidget.jsx and all imports — v1.0
- [x] MOBI-01: Remove MobileAvatarWidget.jsx — v1.0
- [x] MOBI-02: Remove LiveKitEventManager.js and related utils — v1.0
- [x] MOBI-03: Clean up mobile imports and references — v1.0
- [x] API-01: Remove api/liveavatar/ folder entirely — v1.0
- [x] DEP-01: Remove @heygen/liveavatar-web-sdk from package.json — v1.0
- [x] DEP-02: Remove livekit-client from package.json — v1.0
- [x] DEP-03: Run npm install to update lock file — v1.0
- [x] VER-01: App builds without errors — v1.0
- [x] VER-02: App runs without runtime errors — v1.0
- [x] VER-03: Landing page renders correctly — v1.0
- [x] VER-04: v2-avatar routes still work — v1.0
- [x] Tavus avatar integration in v2-avatar/ — existing, preserved
- [x] Landing/home page renders correctly — existing, preserved
- [x] Authentication flow (Supabase) — existing, preserved
- [x] Dashboard and Qudemo management — existing, preserved
- [x] Company management — existing, preserved

### Active (v1.1 Data Loader)

- [ ] DL-01: Create DataLoader class with BundleSource
- [ ] DL-02: Create PersonaAdapter for backwards-compatible API
- [ ] DL-03: Define JSON schemas for course, modules, quizzes, presentations
- [ ] DL-04: Implement schema validation (structure + logical)
- [ ] DL-05: Add security layer (path validation, XSS sanitization)
- [ ] DL-06: Create course bundling script
- [ ] DL-07: Extract Entri content to JSON (13 modules, 6 quizzes, 3 presentations)
- [ ] DL-08: Extract Qatar content to JSON (minimal)
- [ ] DL-09: Extract Evolution content to JSON (4 modules, 1 quiz)
- [ ] DL-10: Create migration validation script
- [ ] DL-11: Add REACT_APP_USE_DATA_LOADER feature flag
- [ ] DL-12: Implement RemoteSource for REST API (Phase 4)
- [ ] DL-13: Verify < 100ms module load time
- [ ] DL-14: Production validation (1 week) before cleanup

### Out of Scope

- Database/CMS integration (future consideration)
- Multi-language support (future consideration)
- Content authoring UI (future consideration)

## Context

**Content to be migrated:**

| Persona | Modules | Quizzes | Presentations | Complexity |
|---------|---------|---------|---------------|------------|
| Entri | 13 | 6 (42 questions) | 3 (32 slides) | High |
| Qatar | 0 | 0 | 0 | Minimal |
| Evolution | 4 | 1 | 0 | Low |

- ~10,200 words of hardcoded content total

**Research document:** .planning/research/dataloader-analysis.md

**Known technical debt (non-blocking):**
- Stub pages remain (ExtendedAvatarPage, WidgetPlayground, etc.)
- LiveAvatarDisplay.jsx is orphaned (not imported, harmless)

**Key files for v1.1:**
- src/v2-avatar/personas/entri/ — content to migrate
- src/v2-avatar/components/TavusAvatarWidget.jsx — main integration point
- src/v2-avatar/hooks/ — existing hooks to extend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Remove HeyGen entirely | Consolidating on Tavus only | Done — v1.0 |
| JSON schema per content type | Easier validation and lazy loading | Planned — v1.1 |
| Bundled imports (not runtime fetch) | Avoid HTTP waterfall, tree-shakeable | Planned — v1.1 |
| PersonaAdapter for gradual migration | Zero changes to TavusAvatarWidget initially | Planned — v1.1 |
| Feature flag for rollback | Instant production rollback if issues | Planned — v1.1 |
| All personas in scope | Qatar/Evolution also need migration | Planned — v1.1 |
| Migration validation script | Automated verification of 121+ items | Planned — v1.1 |
| 1 week production validation | Don't delete old files until stable | Planned — v1.1 |

## Constraints

- **Backwards Compatible**: Existing Entri course must work identically
- **No Regressions**: All current functionality preserved
- **Performance**: Module content loads in < 100ms
- **Graceful Degradation**: App works even if content fetch fails

---
*Last updated: 2026-02-05 — v1.1 Data Loader started*
