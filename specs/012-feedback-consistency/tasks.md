# Tasks: UI State & Feedback Consistency

**Input**: Design documents from `/specs/012-feedback-consistency/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Explicitly required — the constitution calls for Playwright coverage of user-facing flows, and this feature is entirely user-facing behavior; each story's tests are written before its implementation.

**Organization**: Tasks are grouped by user story. All four user stories in this feature are genuinely independent of one another (no shared foundational infrastructure, no new dependency) — there is no Setup or Foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)

> **Shared-file note**: User Stories 2, 3, and 4 all add their Playwright tests to the same new file, `tests/e2e/feedback-consistency.spec.ts` (User Story 1's tests go in the already-existing `tests/e2e/study-sessions.spec.ts` instead). None of the test-writing tasks below are marked `[P]` relative to each other for this reason, even across story boundaries — if these three stories are picked up in parallel by different people, agree on one person scaffolding the empty file first, or sequence who adds their `describe` block first, to avoid a merge conflict on that one file.

---

## Phase 1: User Story 1 - Trustworthy feedback for recorded study sessions (Priority: P1) 🎯 MVP

**Goal**: The study-sessions screen always reflects reality: a new session appears without a reload, a failed edit/delete shows the real error and disables only the acting control while pending, deleting uses the app's own inline confirm, and every session shows when it was recorded.

**Independent Test**: Record a session and see it appear without reloading; force a failing edit and a failing delete and see the real error plus correct disabled state each time; delete a session via the inline confirm-then-button flow; see a date and time on every session — all verifiable without any other story in this feature.

### Tests for User Story 1 ⚠️

> Write first; confirm they fail until T005-T009 exist.

- [X] T001 [US1] Write a Playwright test in `tests/e2e/study-sessions.spec.ts`: recording a session makes it appear in the list immediately, with no page reload (AC01)
- [X] T002 [US1] Write Playwright tests in `tests/e2e/study-sessions.spec.ts`: a failing edit shows the real error next to the session and the Save control is disabled only while that request is pending; a failing delete shows the real error next to the session and the Delete control is disabled only while that request is pending (AC02)
- [X] T003 [US1] Write a Playwright test in `tests/e2e/study-sessions.spec.ts`: clicking "Delete" on a session shows the same inline confirm-then-button controls used by Subjects/Tasks, and no native browser dialog appears (AC03)
- [X] T004 [US1] Write a Playwright test in `tests/e2e/study-sessions.spec.ts`: a recorded session displays a date-and-time string (AC04)

### Implementation for User Story 1

- [X] T005 [US1] Add `defineExpose({ refresh: loadSessions })` to `app/components/study-sessions/StudySessionList.vue`; add a `useTemplateRef` in `app/pages/study-sessions/index.vue` and pass a `@created` handler from `StudySessionForm` that calls `.refresh()` on it, mirroring `app/pages/subjects/index.vue`/`app/pages/tasks/index.vue` (FR-001)
- [X] T006 [US1] In `app/components/study-sessions/StudySessionList.vue`, add per-row saving state and a `reactive<Record<string,string>>` error map for `saveEdit`; render the real error next to the session and disable the Save button only while that request is pending (FR-002) (same file as T005/T007-T009 — sequence after T005)
- [X] T007 [US1] In `app/components/study-sessions/StudySessionList.vue`, add per-row deleting state and a `reactive<Record<string,string>>` error map for `removeSession`; render the real error next to the session and disable the Delete control only while that request is pending (FR-003) (same file — sequence after T006)
- [X] T008 [US1] In `app/components/study-sessions/StudySessionList.vue`, replace the `window.confirm('Delete this study session?')` call with the inline confirm-then-button pattern already implemented in `SubjectList.vue`/`TaskList.vue` (FR-004) (same file — sequence after T007)
- [X] T009 [US1] In `app/components/study-sessions/StudySessionList.vue`, render `session.createdAt` as a formatted date-and-time string next to each entry (FR-005) (same file — sequence after T008)
- [X] T010 [US1] Confirm T001-T004 pass against T005-T009

**Checkpoint**: User Story 1 is functional and independently testable — the study-sessions screen never shows stale or silently-dropped state.

---

## Phase 2: User Story 2 - No stale success or error messages anywhere (Priority: P1)

**Goal**: A "created successfully" message and a field-level validation error each disappear as soon as they stop being true, on the subject/task creation forms and the login/register forms.

**Independent Test**: Create a subject (or task), see the success message, start typing a new entry, and confirm it's gone; trigger a field error on login (or register), start correcting that field, and confirm it's gone — all independent of any other story in this feature.

### Tests for User Story 2 ⚠️

> Write first; confirm they fail until T015-T018 exist.

- [ ] T011 [US2] Write a Playwright test in `tests/e2e/feedback-consistency.spec.ts`: after creating a subject successfully, starting to type a new name clears the "created successfully" message (AC05, subjects)
- [X] T012 [US2] Write a Playwright test in `tests/e2e/feedback-consistency.spec.ts`: after creating a task successfully, starting to type a new title clears the "created successfully" message (AC05, tasks) (same new file as T011 — sequence after it). Implemented out of order at the user's explicit request before T011 existed; the file currently contains only this one test.
- [ ] T013 [US2] Write a Playwright test in `tests/e2e/feedback-consistency.spec.ts`: a field-level error on the login form clears as soon as that field is edited again (AC07, login) (same file — sequence after T012)
- [ ] T014 [US2] Write a Playwright test in `tests/e2e/feedback-consistency.spec.ts`: a field-level error on the register form clears as soon as that field is edited again (AC07, register) (same file — sequence after T013)

### Implementation for User Story 2

- [ ] T015 [P] [US2] In `app/components/subjects/SubjectForm.vue`, add an `@input` handler on the `name`/`description` fields (a `clearStaleStatus()` function, not a reactive `watch` — see T016's note) that resets `status` to `'idle'` and clears `errorMessage` once the student edits the form again after a success or error (FR-006)
- [X] T016 [P] [US2] In `app/components/tasks/TaskForm.vue`, add the same `@input`-driven reset on the form's `title`/`description` fields (FR-007). **Correction while implementing**: a reactive `watch` on `form.title`/`form.description` (as originally planned) does not work — the success handler's own programmatic reset of those fields to `''` also triggers the watcher, and because Vue batches the watcher callback to run after that reset already landed, it reads `status.value === 'success'` as true and immediately clears the message it was just supposed to show, before the student ever sees it. Confirmed by test failure, then fixed by tying the clear to the actual `@input` DOM event instead (which never fires for a script-driven `v-model` assignment), which is immune to this ordering issue. T015 and T023-equivalent SubjectForm work should follow this same `@input` pattern, not the originally-planned `watch`.
- [ ] T017 [P] [US2] In `app/pages/login.vue`, clear only the touched field's own entry in `fieldErrors` as soon as that field is edited again, leaving any other field's error untouched (FR-008)
- [ ] T018 [P] [US2] In `app/pages/register.vue`, apply the same per-field error clearing as `login.vue` (FR-009)
- [ ] T019 [US2] Confirm T011-T014 pass against T015-T018

**Checkpoint**: User Stories 1 and 2 both work independently — no screen in scope shows a message that's no longer true.

---

## Phase 3: User Story 3 - Editing shows the same guidance as creating (Priority: P2)

**Goal**: Editing an existing subject or task shows the same "current/limit" character-count guidance its creation form already shows.

**Independent Test**: Open the edit form for an existing subject, and separately an existing task, and see a live counter matching the creation form — independent of any other story in this feature.

### Tests for User Story 3 ⚠️

> Write first; confirm they fail until T022-T023 exist.

- [ ] T020 [US3] Write a Playwright test in `tests/e2e/feedback-consistency.spec.ts`: editing an existing subject shows a "current/limit" counter under name and description (AC06, subjects) (shares the file from Phase 2 — sequence after T014)
- [X] T021 [US3] Write a Playwright test in `tests/e2e/feedback-consistency.spec.ts`: editing an existing task shows a "current/limit" counter under title and description (AC06, tasks) (same file — sequence after T020). Implemented out of order at the user's explicit request before T020 existed; scoped the assertion to the edit row specifically, since the page's own create form also shows an unrelated "0/500" counter that would otherwise collide.

### Implementation for User Story 3

- [ ] T022 [P] [US3] Add the same name/description character-counter markup from `SubjectForm.vue` to `app/components/subjects/SubjectEditForm.vue`, reusing its existing length constants (FR-010)
- [X] T023 [P] [US3] Add the same title/description character-counter markup from `TaskForm.vue` to `app/components/tasks/TaskEditForm.vue`, reusing its existing length constants (FR-011)
- [ ] T024 [US3] Confirm T020-T021 pass against T022-T023

**Checkpoint**: User Stories 1-3 all work independently.

---

## Phase 4: User Story 4 - The browser tab identifies the app (Priority: P3)

**Goal**: The browser tab reads "StudyFlow" instead of the Nuxt default, on every page.

**Independent Test**: Load any page, authenticated or not, and confirm the tab title — independent of any other story in this feature.

### Tests for User Story 4 ⚠️

> Write first; confirm it fails until T026 exists.

- [ ] T025 [US4] Write a Playwright test in `tests/e2e/feedback-consistency.spec.ts` asserting `page.title()` equals `"StudyFlow"` on at least one authenticated and one unauthenticated page (AC08) (shares the file from Phase 3 — sequence after T021)

### Implementation for User Story 4

- [ ] T026 [US4] Add `app: { head: { title: 'StudyFlow' } } }` to `nuxt.config.ts` (FR-012)
- [ ] T027 [US4] Confirm T025 passes against T026

**Checkpoint**: All four user stories are independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all four stories.

- [ ] T028 Run all [quickstart.md](quickstart.md) validation scenarios and record results
- [ ] T029 Run full standard validation commands (`npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e`) and record evidence in this file

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependency on any other story. Its tests live in the pre-existing `tests/e2e/study-sessions.spec.ts`, so it has zero test-file coordination need with the other three stories.
- **User Story 2 (Phase 2)**: No dependency on User Story 1. Shares `tests/e2e/feedback-consistency.spec.ts` with User Stories 3 and 4 (see the shared-file note above).
- **User Story 3 (Phase 3)**: No dependency on User Stories 1 or 2. Shares `tests/e2e/feedback-consistency.spec.ts` with User Stories 2 and 4.
- **User Story 4 (Phase 4)**: No dependency on any other story. Shares `tests/e2e/feedback-consistency.spec.ts` with User Stories 2 and 3.
- **Polish (Phase 5)**: Depends on all four user stories being complete.

Despite this ordering, **User Stories 1, 2, 3, and 4 can be implemented in any order, or fully in parallel by up to four people** — the only coordination point is the shared new test file for US2/US3/US4 noted above; there is no other cross-story dependency.

### Parallel Opportunities

- T005-T009 (User Story 1) must run in sequence — all in `StudySessionList.vue`.
- T011-T014, T020-T021, and T025 (User Stories 2-4 tests) must run in sequence — all in the same new `tests/e2e/feedback-consistency.spec.ts`.
- T015, T016, T017, and T018 can all run in parallel — four different files, no shared state.
- T022 and T023 can run in parallel — two different files.
- Across stories: User Story 1's implementation (T005-T009) can run fully in parallel with User Story 2's implementation (T015-T018), User Story 3's implementation (T022-T023), and User Story 4's implementation (T026) — none share a file.

---

## Parallel Example: User Story 2 implementation

```bash
# All four can be assigned to different people at the same time:
Task: "Add an @input-driven stale-state reset to SubjectForm.vue"
Task: "Add an @input-driven stale-state reset to TaskForm.vue"
Task: "Add per-field error clearing to login.vue"
Task: "Add per-field error clearing to register.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (User Story 1) — the study-sessions screen is fully trustworthy end-to-end.
2. **STOP and VALIDATE**: run T001-T004; manually exercise `/study-sessions` in `npm run dev`.

### Incremental / Parallel Delivery

1. US1 → study-sessions screen fixed (MVP).
2. US2, US3, US4 → can be picked up immediately and in parallel by different people; only coordinate on who touches `tests/e2e/feedback-consistency.spec.ts` first.
3. Polish → quickstart run, full validation commands including `npm run test:e2e`.

---

## Notes

- No task in this feature touches a server route, a Supabase table, or an RLS policy — every fix is client-side.
- T006/T007 (session edit/delete) must disable the acting control **only** while its own request is pending, then re-enable it regardless of success or failure — this was the explicit resolution of the Clarifications session's first question.
- T009's date display must include both date and time — the explicit resolution of the Clarifications session's second question.
- Mark a task's checkbox only after its tests (where applicable) pass.

## Validation Evidence

_(To be filled in during T028/T029.)_
