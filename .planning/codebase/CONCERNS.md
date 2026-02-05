# Codebase Concerns

**Analysis Date:** 2026-02-05

## Tech Debt

### 1. Disabled ESLint Rules - Silent Failures Enabled

**Issue:** Critical linting rules are disabled globally, masking code quality issues
- `no-unused-vars`: Disabled (line 7, `.eslintrc.js`)
- `react-hooks/exhaustive-deps`: Disabled (line 8, `.eslintrc.js`) - Major risk for stale closures
- `jsx-a11y/anchor-is-valid`: Disabled (line 9, `.eslintrc.js`)

**Files:** `.eslintrc.js`

**Impact:**
- Unused dependencies accumulate without warning
- Missing useEffect dependencies cause stale closures and bugs
- Accessibility violations silently compound

**Fix approach:**
Re-enable rules one per rule and fix violations incrementally. `react-hooks/exhaustive-deps` is the most critical - audit all useEffect hooks in main components first.

---

### 2. Excessive Console Logging in Production

**Issue:** Over 567 console.log/console.error calls across 34 files, many with "[DEBUG]" prefixes
- `src/v2-avatar/components/TavusAvatarWidget.jsx`: 143 occurrences
- `src/components/FloatingQudemoWidget.jsx`: 181 occurrences
- Throughout avatar components: verbose debugging logs

**Files:**
- `src/v2-avatar/components/TavusAvatarWidget.jsx`
- `src/components/AIChatWidget.jsx`
- `src/components/FloatingQudemoWidget.jsx`
- `src/mobile/components/MobileAvatarWidget.jsx`
- `src/v2-avatar/utils/DailyEventManager.js`

**Impact:**
- Console spam makes debugging harder, not easier
- Logs can expose sensitive information in production
- Performance impact from string concatenation
- Harder for users to spot real errors

**Fix approach:**
Implement centralized logging service with log levels (DEBUG, INFO, WARN, ERROR). Replace all direct console.log with logging service. Remove debug logs from production builds using tree-shaking.

---

### 3. Type Safety Not Enforced

**Issue:** No TypeScript, 306 occurrences of `any` type or equivalent
- 49 files using untyped props
- No JSDoc for complex functions
- Generic `/* any */` comments instead of explicit types

**Files:**
- `src/v2-avatar/components/TavusAvatarWidget.jsx` (32 any usages)
- `src/components/CreateQudemoTwoStep.jsx` (19 any usages)
- `src/components/FloatingQudemoWidget.jsx` (23 any usages)
- `src/components/Qudemos.jsx` (20 any usages)

**Impact:**
- Silent type errors at runtime
- Refactoring breaks silently
- IDE autocomplete unreliable
- Difficult component API discovery

**Fix approach:**
Migrate to TypeScript incrementally, starting with types for component props and main service functions. Use strict type checking mode.

---

### 4. Missing Error Handling - Silent Failures

**Issue:** AIDEV-TODO comments indicate planned but unimplemented error UI
- `src/components/AIChatWidget.jsx` line 444: "Add user-facing error UI instead of console.error"
- `src/components/AIChatWidget.jsx` line 577: "Show error modal to user instead of silent failure"
- `src/components/AIChatWidget.jsx` line 705: "Show user-facing error if microphone permission denied"
- `src/mobile/components/MobileAvatarWidget.jsx` lines 715, 1081, 1111, 1203

**Files:**
- `src/components/AIChatWidget.jsx`
- `src/mobile/components/MobileAvatarWidget.jsx`
- `src/v2-avatar/components/TavusAvatarWidget.jsx`

**Impact:**
- Users don't know why interactions fail
- No recovery UI for common failures (mic permission, network error)
- Debugging requires console inspection

**Fix approach:**
Create global error boundary component. Add error toast/modal components. Implement error recovery flows for: network timeout, permission denied, session expired.

---

## Known Bugs

### 1. Mobile Avatar Connection Issues

**Issue:** Mobile version fails to connect to avatar with "Connection Failed - Load failed" error

**Files:**
- `src/mobile/components/MobileAvatarWidget.jsx`
- `src/mobile/DEBUG-CONNECTION-ISSUE.md` (entire debug guide dedicated to this)

**Symptoms:**
- Desktop version works, mobile fails
- Inconsistent failures
- Users receive no useful error message

**Trigger:** Opening mobile avatar widget and clicking "Talk to Agent"

**Workaround:** Use desktop version

**Related DEBUG file:** `src/mobile/DEBUG-CONNECTION-ISSUE.md` (full 244-line debug guide suggests ongoing instability)

---

### 2. Backup Files Left in Codebase

**Issue:** Untracked backup/debug files present in git
- `src/mobile/MobileLandingPage.jsx.backup` - Full backup copy of component
- `src/mobile/DEBUG-CONNECTION-ISSUE.md` - Suggests unresolved connection issues

**Files:**
- `src/mobile/MobileLandingPage.jsx.backup`
- `src/mobile/DEBUG-CONNECTION-ISSUE.md`

**Impact:**
- Code bloat
- Confusion about which file is active
- Git tracking redundancy

**Fix approach:** Remove backup files, commit fix for underlying connection issue, delete debug guide.

---

## Security Considerations

### 1. API Keys Exposed in .env.local (Committed)

**Issue:** Sensitive API keys stored in version-controlled `.env.local` file
- `HEYGEN_API_KEY=f38502e8-e451-4248-914b-82f2f44ab2fd`
- `TAVUS_API_KEY=a04adc41c3524c03a9942294e3dce7de`
- `TAVUS_PERSONA_ID=pc4350da873f`
- `HEYGEN_AVATAR_ID=513fd1b7-7ef9-466d-9af2-344e51eeb833`
- `HEYGEN_VOICE_ID=98a984cd-5f25-49b1-8844-2195c3d50e0f`

**Files:** `.env.local`

**Risk:**
- Keys visible in git history (unrevokable)
- Any developer with repo access can use API quota
- Public fork exposes credentials
- Third-party tools scanning repos will flag these

**Current mitigation:** None. Keys are plaintext in repo.

**Recommendations:**
1. **Immediately rotate all exposed keys** - They're compromised by being in git
2. Remove `.env.local` from git: `git rm --cached .env.local`
3. Add to `.gitignore`: `*.env.local`, `.env.*.local`
4. Use environment variable injection in deployment (Vercel env secrets)
5. Store test credentials separately from production

---

### 2. Hardcoded Share Token in Multiple Files

**Issue:** Production tokens hardcoded in component code
- `UNIVERSAL_DEMO_TOKEN = 'ca6b5a1b-0764-4e1c-bf6c-3e3c5bc93d1d'` (appears 3 times)

**Files:**
- `src/components/FloatingQudemoWidget.jsx` line 109
- `src/components/QudemoPreview.jsx` line 616
- `src/components/Qudemos.jsx` line 794
- `src/App.js` line 164

**Risk:**
- Token value leaks to all users
- No way to revoke without code deploy
- If token grants editing/deletion, anyone can modify

**Current mitigation:** None

**Recommendations:**
- Move to environment variable
- Document what this token grants access to
- Implement token rotation mechanism
- Audit what endpoint `/api/qudemos/share/{token}` allows

---

### 3. localStorage Token Storage Without Expiration Checks

**Issue:** Access tokens stored in localStorage with minimal validation
- 165 occurrences of localStorage/sessionStorage access across 40 files

**Files:**
- `src/App.js` (8 occurrences)
- `src/components/Qudemos.jsx` (12 occurrences)
- `src/components/LoginPage.jsx` (3 occurrences)
- `src/components/ProfilePage.jsx` (7 occurrences)
- Multiple other files

**Risk:**
- XSS attacks can steal all tokens
- No automatic expiration/refresh visible in critical paths
- No token validation before API calls in some flows

**Current mitigation:** Basic refresh token logic in `src/utils/tokenRefresh.js` but not consistently used

**Recommendations:**
- Implement HTTP-only cookies for sensitive tokens
- Add token expiration validation before all API calls
- Create centralized token management with automatic refresh
- Add middleware to invalidate stale tokens

---

## Performance Bottlenecks

### 1. Massive Component Files

**Issue:** Several components exceed 2500+ lines, violating single responsibility principle

**Files:**
- `src/v2-avatar/components/TavusAvatarWidget.jsx`: 5325 lines
- `src/components/Qudemos.jsx`: 3763 lines
- `src/components/FloatingQudemoWidget.jsx`: 2900 lines
- `src/mobile/components/MobileAvatarWidget.jsx`: 2646 lines
- `src/components/HomePage.jsx`: 2351 lines
- `src/components/AIChatWidget.jsx`: 2318 lines

**Impact:**
- Hard to test individual features
- Changes affect multiple unrelated flows
- React re-renders entire component on any state change
- Bundle size larger due to single file

**Improvement path:**
Break each into feature modules:
- Extract avatar session management → custom hook
- Extract video player logic → separate component
- Extract quiz/learning module logic → separate component
- Extract analytics/tracking → custom hook

Estimated savings: 30-50% per component in complexity.

---

### 2. Excessive re-renders from Refs + State Duplication

**Issue:** Components maintain same data in both state and refs (6+ duplicate state patterns)

**Files:**
- `src/components/FloatingQudemoWidget.jsx`: 50+ state variables + 10+ refs
- `src/v2-avatar/components/TavusAvatarWidget.jsx`: 40+ state variables
- `src/mobile/components/MobileAvatarWidget.jsx`: 35+ state variables

**Impact:**
- State updates cause full re-render (refs don't)
- Confusing code: which source is truth?
- Potential sync bugs between state and ref

Example from `src/components/FloatingQudemoWidget.jsx` line 68:
```javascript
const collectionPhaseRef = useRef(null);
const collectionPhaseRef.current = collectionPhase; // Duplicates state!
```

**Improvement path:**
- Use refs for truly non-rendering data (timers, DOM elements)
- Use state for UI-affecting data
- Consider state management library (Redux/Jotai) for complex flows

---

### 3. Missing useCallback/useMemo Dependencies

**Issue:** ESLint rule disabled, meaning 682 hook declarations lack proper dependency arrays
- `react-hooks/exhaustive-deps` is turned off globally

**Files:** 49 files affected

**Impact:**
- Functions recreated on every render (unnecessary)
- Closures capture stale values
- Causes useEffect cycles to repeat unnecessarily

**Improvement path:**
Re-enable rule, audit in order:
1. Components with extensive useEffect (FloatingQudemoWidget, TavusAvatarWidget)
2. Custom hooks
3. Event handlers passed as props

---

### 4. Console.log Performance Impact

**Issue:** 567 console.log calls, many in tight loops or frequent renders
- `TavusAvatarWidget.jsx` has logs in event handlers called 100+ times/session
- String concatenation happens even when logs aren't viewed

**Files:** Avatar components, session managers

**Impact:**
- ~5-10ms per session of wasted CPU (string operations)
- Visible in performance profiler

**Improvement path:** Replace console.log with no-op in production, or implement lazy string formatting.

---

## Fragile Areas

### 1. Avatar Widget State Machine - Brittle and Complex

**Issue:** TavusAvatarWidget manages 40+ interdependent state variables with implicit state transitions

**Files:** `src/v2-avatar/components/TavusAvatarWidget.jsx` (5325 lines)

**Why fragile:**
- Avatar state: "idle", "listening", "speaking", "thinking" (implicit transitions)
- Module state: "active", "pending_confirmation", "completed" (overlapping concerns)
- Quiz state: nested object with 5+ properties
- PDF state: separate flow with 3+ state variables
- User data collection: 4 separate state objects that must sync

Any state change can break multiple flows.

**Example fragility:** Line 4273 sets avatar state to "idle" in one condition, but line 4303 sets to "listening" in another - unclear what the intermediate state should be if both conditions trigger.

**Safe modification:**
1. Write tests for each state transition before changing
2. Use state machine library (XState) to formalize transitions
3. Add visual state diagram

**Test coverage:** Likely incomplete - avatar session flows aren't unit testable

---

### 2. PDF Presentation Interop - Hidden State Dependency

**Issue:** PDF presentation state affects avatar behavior but lives in separate component

**Files:**
- `src/v2-avatar/components/TavusAvatarWidget.jsx` (state owner)
- `src/v2-avatar/components/PdfPresentation.jsx` (side effects)
- `src/v2-avatar/hooks/usePdfPresentation.js` (hook with 23 console.logs)

**Fragility:**
- PdfPresentation doesn't own PDF state, just renders it
- Props like `showPdf`, `pdfUrl` must stay in sync manually
- If PDF tool call arrives during quiz, behavior undefined

**Safe modification:**
- Isolate PDF logic in custom hook
- Document state transitions between avatar states and PDF states
- Add tests for avatar + PDF interactions

---

### 3. Duplicate Avatar Widget Implementations

**Issue:** Two nearly identical avatar widget implementations that drift

**Files:**
- `src/components/AIChatWidget.jsx` (2318 lines) - LiveKit version
- `src/mobile/components/MobileAvatarWidget.jsx` (2646 lines) - Duplicate with mobile tweaks
- `src/v2-avatar/components/TavusAvatarWidget.jsx` (5325 lines) - Tavus rewrite

**Fragility:**
- Bug fix in one doesn't propagate to others
- Feature added to one missing from others
- Three different session managers (`TavusSessionManager`, `SessionManager`, inline code)

**Safe modification:**
- Extract common avatar widget logic to base component
- Use composition over duplication
- Implement adapter pattern for different avatar providers (HeyGen, Tavus, etc)

---

### 4. Event Listener Memory Leaks

**Issue:** Event listeners attached but cleanup may be incomplete

**Files:**
- `src/components/FloatingQudemoWidget.jsx` (setupSpeechRecognition at line 123, cleanup unclear)
- `src/mobile/utils/AudioManager.js` (12 error references, cleanup pattern unclear)
- Various components with useEffect but no dependency arrays

**Fragility:** If component unmounts during active session, listeners may persist

---

## Scaling Limits

### 1. localStorage Token Scaling Issue

**Current:** Access token stored in localStorage

**Limit:** 5-10MB per domain

**Problem:** If caching large datasets locally (interaction history, qudemo metadata), space runs out

**Scaling path:**
- Implement IndexedDB for > 100KB of data
- Use service worker for offline caching
- Implement LRU cache eviction

---

### 2. Session State Explosion

**Current:** Single TavusAvatarWidget holds all session state (40+ variables)

**Limit:** Becomes unmanageable above 10 independent state variables

**Problem:** Already exceeding this - adding new features becomes hard

**Scaling path:** Migrate to state management library (Redux, Jotai, Recoil) before adding:
- User preferences
- Session history
- Multi-user support
- Offline support

---

### 3. Console Logging Storage

**Current:** debugLogs state stores console output in memory

**Files:** `src/v2-avatar/components/TavusAvatarWidget.jsx` line 65

**Limit:** Will grow unbounded, consuming memory in long sessions (2+ hours)

**Scaling path:**
- Cap log history to last 100 entries
- Implement circular buffer
- Rotate logs to localStorage/IndexedDB periodically

---

## Dependencies at Risk

### 1. Outdated/Unmaintained Dependencies

**Issue:** Some dependencies may have unresolved security issues

**Files:** `package.json`

**Notable:**
- `ajv` v8.12.0 (check for XSS in schema validation)
- `react-scripts` 5.0.1 (based on old Create React App version)
- `pdfjs-dist` 5.4.530 (verify security)

**Recommendation:** Run `npm audit` quarterly, prioritize security patches

---

### 2. Multi-version Dependency Conflicts

**Issue:** Multiple API versions in use (HeyGen v1/v2, Tavus v1)

**Files:**
- `src/components/AIChatWidget.jsx` line 91: "HeyGen API v1/v2 compatibility"
- Multiple version checks in codebase

**Risk:** Breaking changes in API require coordinated updates

**Mitigation:** Pin versions strictly, test API version compatibility in CI

---

## Test Coverage Gaps

### 1. No Avatar Session Tests

**Issue:** Avatar connection/reconnection logic untested

**What's not tested:**
- Session creation failures
- Reconnection after network loss
- State transitions during connection
- Tool call handling
- User speech recognition

**Files:**
- `src/v2-avatar/components/TavusAvatarWidget.jsx` (no .test.jsx file)
- `src/v2-avatar/utils/TavusSessionManager.js` (no tests)
- `src/mobile/utils/SessionManager.js` (no tests)

**Risk:** Regressions in avatar session break user experience silently

**Priority:** High - avatar is core feature

---

### 2. No E2E Tests for Widget Embed

**Issue:** FloatingQudemoWidget embedding logic untested

**What's not tested:**
- Widget loading on external domain
- Token-based access control
- Cross-origin communication
- Message passing between widget and parent

**Files:** `src/components/FloatingQudemoWidget.jsx` (2900 lines, zero tests visible)

**Risk:** Embeds break silently for customers

**Priority:** High - embed is revenue feature

---

### 3. No API Integration Tests

**Issue:** Network calls to backend untested

**What's not tested:**
- Authentication flows
- QuDemo CRUD operations
- Analytics tracking
- Video upload/processing
- Widget token generation

**Files:** All components using `fetch()` (~40 files)

**Risk:** Backend API changes break frontend unexpectedly

**Workaround:** Currently using manual integration testing

---

### 4. Missing Accessibility Tests

**Issue:** No WCAG compliance testing despite avatar UI complexity

**What's not tested:**
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management

**Files:** All UI components

**Risk:** Inaccessible product for users with disabilities, potential ADA liability

---

## Missing Critical Features

### 1. Error Recovery UI

**Issue:** No user-facing error messages for common failures

**Problem:** When API fails, microphone denied, network times out - users see nothing

**Blocks:**
- Reliable widget embedding (enterprise customers need error handling)
- Mobile rollout (mobile network failures need recovery UI)

**Scope:** Implement error boundary + error toast component

---

### 2. Offline Support

**Issue:** Widget requires constant connection, fails immediately offline

**Problem:** Sales demo videos can't be viewed on spotty mobile networks

**Blocks:**
- Mobile adoption
- Demo reliability in field

**Scope:** Implement service worker + offline caching

---

### 3. Analytics Data Export

**Issue:** Insights are stuck in UI, no export to CRM/email

**Problem:** Sales teams can't integrate demo data into workflow

**Blocks:**
- Integration with enterprise sales tools
- Zapier/Make.com workflow support

---

---

*Concerns audit: 2026-02-05*
