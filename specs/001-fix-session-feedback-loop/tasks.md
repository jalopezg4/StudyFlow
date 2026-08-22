---

description: "Task list template for feature implementation"
---

# Tasks: Study Session Feedback & Refresh Fixes

**Input**: Design documents from `/specs/001-fix-session-feedback-loop/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested for TDD; a single E2E-coverage task is included in Polish to satisfy the constitution's "critical end-to-end user flows should have Playwright coverage" gate.

**Organization**: Tasks are grouped by user story (from spec.md, priority order P1 → P1 → P2 → P3) to enable independent implementation and testing of each story. All work touches exactly 3 files, matching the scope the user selected from GitHub Issue #60.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single Nuxt 4 project. All implementation paths are under `app/`; the one test file touched is under `tests/e2e/`. No `backend/`/`frontend/` split (Nitro server routes under `server/` are unchanged by this feature).

---

## Phase 1: Setup

**Purpose**: Confirm the starting state before making any changes — no new dependencies or project initialization are needed for this feature.

- [X] T001 Start the dev server (`npm run dev`), log in as a test student with at least one existing Subject, and walk through `specs/001-fix-session-feedback-loop/quickstart.md` Prerequisites to confirm the current (unfixed) behavior: submitting a session does not refresh the list, delete uses a native `window.confirm`, and no recorded date is shown.

**Checkpoint**: Baseline (broken) behavior confirmed and understood before editing any file.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by all user stories.

**⚠️ N/A for this feature**: There is no shared new infrastructure to build. Each user story below is an additive edit to already-existing, already-working components (`StudySessionForm.vue`, `StudySessionList.vue`, `study-sessions/index.vue`). Proceed directly to Phase 3.

---

## Phase 3: User Story 1 - See a newly recorded session right away (Priority: P1) 🎯 MVP

**Goal**: After a student successfully submits the "record study session" form, the new session appears in the list below immediately, with no manual reload. (AC01)

**Independent Test**: Submit a valid "record study session" form and observe the new entry appear in the recorded sessions list without a manual page reload.

### Implementation for User Story 1

- [X] T002 [P] [US1] Emit a `created` event with the created session payload on successful submit in `app/components/study-sessions/StudySessionForm.vue`, mirroring `app/components/subjects/SubjectForm.vue`'s emit pattern.
- [X] T003 [P] [US1] Add `defineExpose({ refresh: loadSessions })` to `app/components/study-sessions/StudySessionList.vue` so a parent can trigger a reload, mirroring `app/components/subjects/SubjectList.vue`.
- [X] T004 [US1] In `app/pages/study-sessions/index.vue`, add `useTemplateRef` for the list component, add `@created` on `<StudySessionForm>` calling the list's `refresh()`, and add `ref="sessionList"` (or equivalent) on `<StudySessionList>`, mirroring `app/pages/subjects/index.vue`. Depends on T002 and T003.

**Checkpoint**: Recording a session now refreshes the list immediately — User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Know when an edit or delete actually failed (Priority: P1)

**Goal**: When editing or deleting a recorded session fails, the actual error message is shown next to that session instead of being silently dropped. (AC02)

**Independent Test**: Force an edit save or a delete to fail (e.g. block the PATCH/DELETE request in devtools) and confirm the specific error message renders next to that session.

### Implementation for User Story 2

- [X] T005 [US2] In `app/components/study-sessions/StudySessionList.vue`, fix the template so the existing `errorMessage` renders whenever it is non-empty for an edit failure, instead of being gated behind the page-level `status === 'error'` condition (which is never true again after the initial load succeeds).
- [X] T006 [US2] In `app/components/study-sessions/StudySessionList.vue`, add a per-session `deleteErrors` (`Record<string, string>`) ref, set `deleteErrors[session.id]` in `removeSession`'s catch block instead of (or in addition to) the shared `errorMessage`, and render it next to the affected session in the template.

**Checkpoint**: Edit and delete failures are now visibly reported next to the affected session — User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Delete a session with the same confirm pattern used elsewhere (Priority: P2)

**Goal**: Clicking "Delete" on a session uses the same inline confirm-then-button pattern already used by Subjects and Tasks, not a native `window.confirm` dialog. (AC03)

**Independent Test**: Click "Delete" on a recorded session and confirm an inline confirmation step appears in the page (no native browser dialog); confirm it deletes the session, and cancel leaves it untouched.

### Implementation for User Story 3

- [X] T007 [US3] In `app/components/study-sessions/StudySessionList.vue`, add a `confirmingDeleteId` ref and `requestDelete(id)` / `cancelDelete(id)` / `confirmDelete(id)` functions (mirroring `app/components/subjects/SubjectList.vue`), replacing the `window.confirm('Delete this study session?')` call in `removeSession`, and reusing the `deleteErrors` map from T006 inside `confirmDelete`/`cancelDelete`.
- [X] T008 [US3] In `app/components/study-sessions/StudySessionList.vue`'s template, replace the direct "Delete" button (that called `removeSession` via `window.confirm`) with: a "Delete" button that calls `requestDelete(session.id)` when no confirmation is pending, and an inline confirm block (confirm/cancel buttons + the `deleteErrors[session.id]` message) shown when `confirmingDeleteId === session.id`, mirroring `SubjectList.vue`'s markup. Depends on T007.

**Checkpoint**: Delete now uses the app's inline two-step confirm pattern — User Stories 1, 2 AND 3 all work independently.

---

## Phase 6: User Story 4 - See when each session was recorded (Priority: P3)

**Goal**: Every recorded session shows the date it was recorded. (AC04)

**Independent Test**: View the recorded sessions list and confirm every entry displays the date it was recorded.

### Implementation for User Story 4

- [X] T009 [US4] In `app/components/study-sessions/StudySessionList.vue`'s template, render `session.createdAt` (already present on the `StudySession` interface and already returned by `GET /api/study-sessions`) as a formatted date next to each session's duration/subject/task info.

**Checkpoint**: All four user stories are now independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans all four user stories.

- [X] T010 [P] Extend `tests/e2e/study-sessions.spec.ts` with scenarios covering: the recorded session appears in the list right after submit with no reload (AC01); an edit or delete failure shows an error next to the session (AC02); deleting requires the inline confirm step with no native `window.confirm` dialog, and cancel leaves the session in place (AC03); the recorded date is visible on each session (AC04).
- [~] T011 Walk through `specs/001-fix-session-feedback-loop/quickstart.md` manual validation steps end-to-end against the finished implementation. NOT run — attempted to stand up a local Supabase (`npx supabase init` + `npx supabase start` on Docker) to validate without real cloud credentials; Docker Desktop's backend repeatedly disconnected mid-pull in this sandbox (`failed to connect to the docker API at npipe://...`) and never stabilized after ~10 min. Init artifacts were removed afterward (`supabase/.gitignore`, `supabase/config.toml`, `supabase/.temp/` — working tree is clean). Needs a manual pass (or `npm run test:e2e`) with real Supabase credentials, or on a machine where Docker Desktop is stable, before merge.
- [~] T012 Run the full quality gate before opening the PR: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run build`. `lint` (0 errors, 1 pre-existing unrelated warning), `typecheck`, `test` (264/264 passed), and `build` all ran clean. `test:e2e` was NOT run — see T011; must be run before merge.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: N/A for this feature — no shared new infrastructure.
- **User Stories (Phase 3-6)**: All operate on the same 3 files. US1 (Phase 3) is independent of the others and can be done first or in parallel by a different person than US2-US4. US2 (Phase 4), US3 (Phase 5), and US4 (Phase 6) all edit `StudySessionList.vue`, so within a single contributor's work they should be done **sequentially in priority order** to avoid clobbering each other's edits to the same file, even though each story is independently testable once its own tasks land.
- **Polish (Phase 7)**: Depends on all four user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories. Touches `StudySessionForm.vue`, `StudySessionList.vue` (expose only), `study-sessions/index.vue`.
- **User Story 2 (P1)**: No functional dependency on US1, but shares `StudySessionList.vue` — implement after US1's T003 lands in that file to avoid edit conflicts.
- **User Story 3 (P2)**: Reuses the `deleteErrors` map introduced in US2 (T006); implement after US2.
- **User Story 4 (P3)**: No dependency on US2/US3's logic, but shares the same template file — implement last to avoid merge conflicts within the file.

### Within Each User Story

- US1: T002 and T003 (different files) can run in parallel; T004 depends on both.
- US2: T005 and T006 are both in `StudySessionList.vue` — do sequentially, either order.
- US3: T007 before T008 (script state before the template that uses it).
- US4: T009 is standalone.

### Parallel Opportunities

- T002 (`StudySessionForm.vue`) and T003 (`StudySessionList.vue` expose) can run in parallel — different files, no shared state.
- T010 (E2E test extension) can be drafted in parallel with the later implementation tasks, though it can only be run green once T002-T009 are complete.
- Because `StudySessionList.vue` is edited by T003 and every task in US2/US3/US4, those tasks are **not** parallelizable with each other — treat them as one sequential thread per file.

---

## Parallel Example: User Story 1

```bash
# T002 and T003 touch different files and have no dependency on each other:
Task: "Emit a `created` event on successful submit in app/components/study-sessions/StudySessionForm.vue"
Task: "Add defineExpose({ refresh: loadSessions }) in app/components/study-sessions/StudySessionList.vue"

# T004 must wait for both to land before wiring them together:
Task: "Wire useTemplateRef + @created -> refresh() in app/pages/study-sessions/index.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Skip Phase 2 (N/A).
3. Complete Phase 3: User Story 1 (T002-T004).
4. **STOP and VALIDATE**: Record a session and confirm it appears in the list with no reload.
5. This alone resolves AC01 / SC-001 and is safe to ship on its own.

### Incremental Delivery

1. Setup → Phase 3 (US1) → validate → the live-refresh loop works end-to-end.
2. Add Phase 4 (US2) → validate → edit/delete errors are now visible.
3. Add Phase 5 (US3) → validate → delete uses the inline confirm pattern.
4. Add Phase 6 (US4) → validate → recorded date is visible.
5. Phase 7 (Polish) → extend E2E coverage, run the full quality gate, open the PR.

Given all four stories converge on one small set of files and one GitHub Issue, the realistic delivery is a single PR that completes Phases 1, 3-7 in order — but each phase boundary above is still a valid place to pause and manually verify one acceptance criterion before moving to the next.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps each task to its user story (US1-US4) for traceability back to spec.md and Issue #60's AC01-AC04.
- No test tasks were added per-story (tests were not explicitly requested); T010 in Polish covers E2E validation for all four stories at once, per the constitution's testing gate.
- No new dependencies, API endpoints, or database changes are introduced — confirmed in plan.md and research.md.
- Commit after each task or logical group; stop at any checkpoint above to validate a story independently before continuing.
