# Tasks: Study Sessions Feedback Loop

**Input**: Design documents from `/specs/012-study-sessions-feedback-loop/`

**Prerequisites**: plan.md, spec.md

## Phase 1: User Story 1 - See a newly recorded session immediately (P1)

- [x] T001 [US1] Add a `created` emit to `StudySessionForm.vue`, firing right after a successful submit with the created session (FR-001)
- [x] T002 [US1] Wire `study-sessions/index.vue`: `useTemplateRef` for the list + `@created` handler calling `refresh()`, mirroring `tasks/index.vue` (FR-002)
- [x] T003 [US1] Add `defineExpose({ refresh: loadSessions })` to `StudySessionList.vue` so the page above can call it (FR-003)
- [x] T004 [US1] Extend `tests/e2e/study-sessions.spec.ts`'s existing "records a session" scenario to assert the new session appears in the list without a reload

## Phase 2: User Story 2 - See the real reason an edit or delete failed (P1)

- [x] T005 [US2] Fix `StudySessionList.vue` so a `saveEdit` failure's error message renders unconditionally (not gated on page-level `status === 'error'`) (FR-004)
- [x] T006 [US2] Add a new E2E scenario: trigger a real edit failure (e.g. an out-of-range duration) and assert the actual error message is shown

## Phase 3: User Story 3 - Use the app's own confirm pattern (P2)

- [x] T007 [US3] Replace `window.confirm(...)` in `StudySessionList.vue`'s delete flow with an inline `requestDelete`/`confirmDelete`/`cancelDelete` control (including a per-session delete-error slot), mirroring `SubjectList.vue` (FR-005)
- [x] T008 [US3] Add a new E2E scenario: click "Delete", verify no native dialog fires and the inline confirm/cancel controls work

## Phase 4: User Story 4 - See when each session was recorded (P2)

- [x] T009 [US4] Render `session.createdAt` in `StudySessionList.vue`, formatted for readability (FR-006)
- [x] T010 [US4] Extend an E2E scenario to assert a recorded-date string is visible for a session

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T011 Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` and record results
- [x] T012 Manually trace through all 4 ACs against the final code once more before opening the PR

## Notes

- No task here touches `server/api/study-sessions/*`, `server/utils/study-sessions/*`, or any migration.
- E2E tests cannot be executed live in this environment (no local Supabase project configured) — same long-standing limitation already documented for every prior HU in this codebase. Correctness is verified by code review against the acceptance criteria and by mirroring already-proven patterns (Subjects/Tasks) line for line.

## Validation Evidence

Recorded during implementation (T011), run from the project root:

- `npm run lint` — 0 errors (1 pre-existing warning in `PasswordInput.vue`, unrelated to this feature).
- `npm run typecheck` — passes with no errors.
- `npm run test` — 30 test files, 264 tests, all passing.
- `npm run build` — production build completes successfully.

E2E scenarios (T004, T006, T008, T010) were added to `tests/e2e/study-sessions.spec.ts` covering AC01-AC04, but per the note above cannot be executed live in this environment (no local Supabase project configured); correctness was verified by manual trace against the final component code (T012).
