# Tasks: Create Study Task

**Input**: Design documents from `/specs/005-create-study-task/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included below, written before their corresponding implementation, mirroring the existing `tests/subjects/` pattern.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Core persistence and validation primitives that every user story's tests depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Create the `study_tasks` table migration (columns, length/status check constraints, FK to `subjects` without cascade, RLS enabled, `study_tasks_select_own` + `study_tasks_insert_own` policies) in `supabase/migrations/20260819000000_create_study_tasks_table.sql` per [data-model.md](data-model.md)
- [x] T002 [P] Implement `CreateStudyTaskSchema` (Zod: `subjectId` required uuid, `title` trimmed 1-100 chars required, `description` optional ≤500 chars, `dueDate` optional valid-date string, no `userId`/`status` field defined) in `server/utils/tasks/schemas.ts` (FR-002 through FR-007, FR-009)
- [x] T003 [P] Implement `createStudyTask(userId, input)` repository function using the existing server-only Supabase client pattern in `server/utils/tasks/repository.ts` (FR-009)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 2: User Story 1 - Create a task for one of my subjects (Priority: P1) 🎯 MVP

**Goal**: An authenticated student can submit a title (and optional description/due date) for a subject they own and see the task persisted, linked, and `pending`.

**Independent Test**: Submit a valid task as an authenticated principal for a subject they own and verify it is stored, owned by that principal, linked to the correct subject, `pending`, and retrievable.

### Tests for User Story 1 ⚠️

> Write first; confirm they fail until T006 exists.

- [x] T004 [P] [US1] Write valid-creation tests (title only; title + description + due date; title only with optional fields omitted) asserting `201`, correct persisted `subjectId`/`title`/`description`/`dueDate`/`status: 'pending'` in `tests/tasks/create-task.spec.ts`, using the `createTestEvent`-style authenticated fixture pattern from `tests/security/fixtures.ts`

### Implementation for User Story 1

- [x] T005 [US1] Implement `POST /api/tasks` in `server/api/tasks/index.post.ts`, composing `requireAuthenticatedPrincipal` → `validateWithSchema(CreateStudyTaskSchema, ...)` → `getSubjectForOwner` (reused from `server/utils/subjects/repository.ts`, 404 if null) → `createStudyTask` → `201` response, with `sendSafeError` for failures, per [contracts/study-task-creation-contract.md](contracts/study-task-creation-contract.md) (FR-001, FR-007, FR-008, FR-009, FR-012)
- [x] T006 [P] [US1] Build `TaskForm.vue` (subject picker populated from `GET /api/subjects`, title/description/due-date fields, submit button, loading state) in `app/components/tasks/TaskForm.vue`
- [x] T007 [US1] Build `app/pages/tasks/index.vue` hosting `TaskForm`, showing a success confirmation after creation (depends on T006)
- [x] T008 [US1] Confirm T004 passes against T005

**Checkpoint**: User Story 1 is functional and independently testable — a student can create a task end-to-end (backend verified by tests; frontend manually reviewable in `npm run dev`).

---

## Phase 3: User Story 2 - Be blocked from creating a task under another student's subject (Priority: P1)

**Goal**: A task can never be created under a subject id that does not belong to the requesting student, whether it belongs to someone else or does not exist at all.

**Independent Test**: Attempt creation under a subject id owned by a different student, and under a subject id that never existed, and verify both return `404 NOT_FOUND` with no task created.

### Tests for User Story 2 ⚠️

- [x] T009 [US2] Write cross-owner denial test (Student B creating under Student A's subject id) and nonexistent-subject test, both asserting `404 NOT_FOUND` and zero persisted rows, in `tests/tasks/ownership.spec.ts` (depends on T005 existing)

### Implementation for User Story 2

- [x] T010 [US2] Confirm T009 passes against T005's existing ownership check (no new production code expected — if it fails, fix `server/api/tasks/index.post.ts` before proceeding)

**Checkpoint**: User Stories 1 and 2 both work independently — tasks can only ever be created under a subject the requester owns.

---

## Phase 4: User Story 3 - Reject invalid task data (Priority: P2)

**Goal**: Empty, whitespace-only, or over-length title, over-length description, or an invalid due date is rejected with a clear validation error and nothing is persisted.

**Independent Test**: Attempt creation with each invalid input case and verify a `422 VALIDATION_ERROR` with no persisted row.

### Tests for User Story 3 ⚠️

- [x] T011 [P] [US3] Write `CreateStudyTaskSchema` unit tests: missing/empty/whitespace-only title, title > 100 chars, description > 500 chars, description omitted/empty (allowed), invalid `dueDate`, empty-string `dueDate` (treated as no due date), and a client-supplied `status`/`userId` field being ignored/absent from the parsed schema, in `tests/tasks/schema.spec.ts`
- [x] T012 [US3] Extend `tests/tasks/create-task.spec.ts` with route-level cases asserting `422 VALIDATION_ERROR` and zero persisted rows for the same invalid cases (depends on T004/T005 existing)

### Implementation for User Story 3

- [x] T013 [US3] Surface the API's `VALIDATION_ERROR` message/details as an inline error state in `TaskForm.vue` (depends on T006/T007)
- [x] T014 [US3] Confirm T011/T012 pass

**Checkpoint**: All three user stories work independently — invalid input and cross-ownership attempts never reach persistence, and the UI communicates why.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all three stories.

- [x] T015 [P] Add an ownership-spoofing test (extraneous `userId`/`status` fields alongside valid data; assert the persisted row's `user_id` is the authenticated principal's id and `status` is always `'pending'` regardless) and an unauthenticated-rejection test (`401 UNAUTHENTICATED`, zero persisted rows) in `tests/tasks/ownership.spec.ts` (FR-007, FR-009, FR-010)
- [x] T016 [P] Add a link to `/tasks` from `app/pages/dashboard.vue`, mirroring the existing `/subjects` link
- [x] T017 Run all [quickstart.md](quickstart.md) validation scenarios and record results
- [x] T018 Run full standard validation commands (`npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) and record evidence in this file

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately.
- **User Stories (Phase 2-4)**: Depend on Foundational. US2 and US3 both extend the same handler and test files US1 creates (T005, T004's spec file), so US1 should land first even though US1/US2 are both P1.
- **Polish (Phase 5)**: Depends on all three user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational. Delivers the handler, form, and page every other story builds on.
- **User Story 2 (P1)**: Starts after Foundational; exercises US1's handler with cross-ownership cases. Not independently deployable before US1 (there is nothing to deny creation *from* without US1's endpoint), but independently testable once US1 exists.
- **User Story 3 (P2)**: Starts after Foundational; extends US1's handler behavior and test file with negative cases. Same relationship as US2.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T004 and T006 can run in parallel (different files).
- T011 can run in parallel with T006/T007 (different files).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Foundational).
2. Complete Phase 2 (US1) — a student can create a task end-to-end.
3. **STOP and VALIDATE**: run T004/T008; manually exercise the form in `npm run dev`.

### Incremental Delivery

1. Foundational → migration and validation/persistence primitives ready.
2. US1 → creation works end-to-end (MVP).
3. US2 → cross-ownership attempts are provably rejected.
4. US3 → invalid input is provably rejected, UI explains why.
5. Polish → spoofing/unauthenticated checks, dashboard link, quickstart run, full validation commands.

---

## Notes

- No task in this HU implements listing, editing, status changes, or deleting tasks — those are HU06 (see [research.md](research.md) Decision 5).
- `user_id` and `status` must never be read from request input at any point in T005 — `user_id` only from `requireAuthenticatedPrincipal(event)`, `status` is never client-settable at all.
- Mark a task's checkbox only after its tests (where applicable) pass.

## Validation Evidence

- `npm ci`: failed on this machine (`Missing: commander@15.0.0 from lock file`) against the repository's committed lockfile — a pre-existing, environment-specific lockfile/npm-version mismatch unrelated to this feature (a different symptom of the same class of Windows `npm ci` issue already documented in `specs/003-security-quality-baseline/tasks.md`). Recovered with a plain `npm install` (858 packages; pre-existing ESLint peer-dependency warnings unrelated to this feature, no errors); `package-lock.json` was reverted afterward via `git checkout` so no incidental lockfile churn is included in this change.
- `npm run lint`: passed (0 errors; 1 pre-existing warning in `app/components/PasswordInput.vue`, unrelated to this feature).
- `npm run typecheck`: passed (run with `NUXT_TELEMETRY_DISABLED=1`).
- `npm run test`: passed (17 files, 116 tests — 34 in the three new `tests/tasks/*.spec.ts` files, 82 pre-existing tests unaffected).
- `npm run build`: passed; confirmed via the built Nitro route manifest that `POST /api/tasks` is registered correctly (`route: '/api/tasks', method: "post"`, found in `.output/server/chunks/_/nitro.mjs`).
- Manual smoke test against `npm run dev`: `GET /tasks`, `GET /subjects`, and `GET /dashboard` all returned `500` due to no live Supabase project being configured in this environment (no `.env`) — `server/middleware/auth.ts` requires real Supabase credentials to resolve auth context on every request, so this affects all pages equally and is not specific to this feature. This matches the same "Known Limitation" already documented in `specs/004-subject-management/quickstart.md` and `specs/004-subject-management/tasks.md` for HU03. Not exercised in this environment: the actual migration SQL against a real Postgres instance, and RLS policy enforcement itself (`createStudyTask`/`getSubjectForOwner` are mocked at the repository boundary in all automated tests).
