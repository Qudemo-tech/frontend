# Roadmap: Avatar Frontend

## Milestones

- v1.0 HeyGen Removal (4 phases, shipped)
- v1.1 Data Loader (5 phases, shipped)
- v1.2 5G Bilingual Support (4 phases, in progress)

## v1.2 5G Bilingual Support

**Milestone Goal:** Add English/Arabic language switching to the 5G course so users can toggle languages and have the full experience (avatar speech, quizzes, prompts, narrations) delivered in the selected language.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions if needed

- [ ] **Phase 1: Arabic Content** - Create complete Arabic translation files for all 5G course content
- [ ] **Phase 2: Language Toggle** - Add EN/AR toggle button to bottom control bar with active language indication
- [ ] **Phase 3: Conversation Lifecycle** - Wire toggle to end current conversation and restart in selected language via Tavus API
- [ ] **Phase 4: RTL Text Rendering** - Apply right-to-left text direction for Arabic content within existing LTR layout

## Phase Details

### Phase 1: Arabic Content
**Goal**: All 5G course content exists in Arabic so the application has translated material to serve when Arabic is selected
**Depends on**: Nothing (first phase)
**Requirements**: ARBC-01, ARBC-02, ARBC-03, ARBC-04, ARBC-05
**Success Criteria** (what must be TRUE):
  1. Arabic prompts file exists with translations for all ~171 lines of English prompts (module intros, explanations, transitions)
  2. Arabic quiz file exists with translations for all 6 MCQ questions and their answer options across 3 quizzes
  3. Arabic narration file exists with translations for all PDF presentation narrations
  4. Arabic module transition prompts and course completion prompt exist and are loadable by the application
  5. English content continues to work unchanged -- no regressions in existing 5G course behavior
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md -- Arabic prompts and PDF narration (spoken content)
- [ ] 01-02-PLAN.md -- Arabic quizzes and module metadata (structured content)

### Phase 2: Language Toggle
**Goal**: Users can see and interact with an EN/AR language toggle in the bottom control bar that clearly shows which language is active
**Depends on**: Nothing (can be built independently of Phase 1)
**Requirements**: LANG-01, LANG-02, LANG-03
**Success Criteria** (what must be TRUE):
  1. A language toggle button appears in the bottom control bar between the existing mic/speaker/disconnect buttons
  2. The toggle visually indicates the currently active language (EN or AR) at all times
  3. User can click the toggle to switch between EN and AR during an active conversation
  4. The toggle only appears for the 5G persona -- other personas are unaffected
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Conversation Lifecycle
**Goal**: When the user switches language, the system seamlessly ends the current conversation and starts a new one in the selected language with the avatar speaking correctly
**Depends on**: Phase 1 (Arabic content must exist), Phase 2 (toggle must exist to trigger switch)
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04, AVTR-01, AVTR-02, AVTR-03
**Success Criteria** (what must be TRUE):
  1. Switching language ends the current Tavus conversation gracefully (no orphaned sessions or errors)
  2. A new Tavus conversation is created with `properties.language` set to "Arabic" or "english" matching the toggle
  3. After switching, the 5G course restarts from the first module in the newly selected language
  4. The avatar speaks in Arabic when Arabic is selected and in English when English is selected
  5. The transition between end-and-restart feels seamless with minimal visible loading or disruption
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: RTL Text Rendering
**Goal**: Arabic text content renders right-to-left within its containers so Arabic quiz questions, prompts, and narrations are readable in natural Arabic reading order
**Depends on**: Phase 1 (Arabic content must exist), Phase 3 (language switch must work so Arabic content is actually displayed)
**Requirements**: RTXT-01, RTXT-02, RTXT-03
**Success Criteria** (what must be TRUE):
  1. Arabic quiz questions and answer options render right-to-left within quiz containers
  2. Arabic prompts and narration text render right-to-left within their display containers
  3. Overall page layout (sidebar, navigation, control bar) remains left-to-right regardless of selected language
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Coverage

| Requirement | Phase | Category |
|-------------|-------|----------|
| ARBC-01 | Phase 1 | Arabic Content |
| ARBC-02 | Phase 1 | Arabic Content |
| ARBC-03 | Phase 1 | Arabic Content |
| ARBC-04 | Phase 1 | Arabic Content |
| ARBC-05 | Phase 1 | Arabic Content |
| LANG-01 | Phase 2 | Language Toggle |
| LANG-02 | Phase 2 | Language Toggle |
| LANG-03 | Phase 2 | Language Toggle |
| CONV-01 | Phase 3 | Conversation Mgmt |
| CONV-02 | Phase 3 | Conversation Mgmt |
| CONV-03 | Phase 3 | Conversation Mgmt |
| CONV-04 | Phase 3 | Conversation Mgmt |
| AVTR-01 | Phase 3 | Avatar Speech |
| AVTR-02 | Phase 3 | Avatar Speech |
| AVTR-03 | Phase 3 | Avatar Speech |
| RTXT-01 | Phase 4 | Text Direction |
| RTXT-02 | Phase 4 | Text Direction |
| RTXT-03 | Phase 4 | Text Direction |

**Mapped: 18/18 -- 100% coverage**

## Progress

**Execution Order:** Phase 1 -> Phase 2 -> Phase 3 -> Phase 4
(Phases 1 and 2 have no cross-dependency and could execute in parallel if desired.)

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Arabic Content | 0/2 | Planned | - |
| 2. Language Toggle | 0/TBD | Not started | - |
| 3. Conversation Lifecycle | 0/TBD | Not started | - |
| 4. RTL Text Rendering | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-11*
*Milestone: v1.2 5G Bilingual Support*
