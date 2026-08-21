# Tasks: Study Session Recording

**Input**: Design documents from `/specs/009-study-session-recording/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Foundational

- [x] T001 [P] Create the `study_sessions` migration with owner, subject, optional task, bounded duration, timestamps, foreign keys, RLS enablement, and owner-scoped insert/select policies in `supabase/migrations/20260820030000_create_study_sessions_table.sql`
- [x] T002 [P] Add `CreateStudySessionSchema` for `subjectId`, optional `taskId`, and integer `durationMinutes` from 1 through 1,440 in `server/utils/study-sessions/schemas.ts`
- [x] T003 [P] Define the `StudySession` domain type and row-to-domain mapping in `server/utils/study-sessions/repository.ts`
- [x] T004 Add the study-session creation contract and validation scenarios to `specs/009-study-session-recording/contracts/study-session-creation-contract.md` and `specs/009-study-session-recording/quickstart.md`

## Phase 2: User Story 1 - Record a study session (Priority: P1)

- [x] T005 [P] [US1] Add valid and invalid duration schema tests in `tests/study-sessions/schema.spec.ts`
- [x] T006 [P] [US1] Add repository tests for creating a subject-only session and a task-linked session in `tests/study-sessions/create-session-repository.spec.ts`
- [x] T007 [US1] Implement `createStudySession` with server-provided owner and request-scoped Supabase client in `server/utils/study-sessions/repository.ts`
- [x] T008 [US1] Implement `POST /api/study-sessions` with authentication, body validation, safe errors, and `201` response in `server/api/study-sessions/index.post.ts`
- [x] T009 [US1] Add route tests for valid subject-only and task-linked creation, including persisted response mapping, in `tests/study-sessions/create-session.spec.ts`

## Phase 3: User Story 2 - Reject invalid duration (Priority: P1)

- [x] T010 [P] [US2] Add route cases for missing, malformed, zero, negative, decimal, and over-limit durations with zero persistence in `tests/study-sessions/create-session.spec.ts`
- [x] T011 [US2] Confirm invalid requests fail validation before subject/task lookup or insertion in `tests/study-sessions/create-session.spec.ts`

## Phase 4: User Story 3 - Enforce resource ownership (Priority: P1)

- [x] T012 [P] [US3] Add cross-owner subject, cross-owner task, mismatched task/subject, nonexistent resource, and unauthenticated cases in the repository and route tests under `tests/study-sessions/`
- [x] T013 [US3] Implement owner-scoped subject/task lookup and same-subject consistency checks before insert in `server/utils/study-sessions/repository.ts`
- [x] T014 [US3] Confirm safe `404 NOT_FOUND` behavior and no persistence for unauthorized or inconsistent references in `server/api/study-sessions/index.post.ts`

## Phase 5: User-facing integration and polish

- [x] T015 [P] Add an authenticated study-session creation form and success/error states in `app/components/study-sessions/StudySessionForm.vue`
- [x] T016 [US1] Add the protected study-session creation page and navigation entry from the authenticated workflow in `app/pages/study-sessions/index.vue` and `app/pages/dashboard.vue`
- [x] T017 [P] [US1] Add Playwright coverage for protected access and valid session creation in `tests/e2e/study-sessions.spec.ts`
- [ ] T018 Run the quickstart scenarios and record live Supabase/RLS evidence in `specs/009-study-session-recording/quickstart.md`
- [x] T019 Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`; record results in this file

## Dependencies and Parallel Work

- T001, T002, and T003 can proceed in parallel.
- T005 and T006 can proceed in parallel after the foundational contract is stable.
- T010 and T012 can proceed in parallel with route implementation once the route shape is fixed.
- T015 and T017 can proceed in parallel after the API contract and UI route are stable.
- User Story 1 establishes the persistence path; User Stories 2 and 3 harden validation and ownership before UI integration.

## MVP Scope

T001-T009 and T012-T014 deliver the smallest secure end-to-end API slice. T015-T017 complete the browser workflow for Demo Day readiness.

## Validation Evidence

- `npm run lint`: passed with one pre-existing warning in `app/components/PasswordInput.vue`.
- `npm run typecheck`: passed.
- `npm run test`: passed, 27 files and 252 tests.
- `npm run build`: passed; the study-session page and API route are included in the production output.
- T018 remains open until the migration and RLS behavior are exercised against a real Supabase project with at least two authenticated users.
