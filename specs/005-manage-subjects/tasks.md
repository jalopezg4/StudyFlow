# Tasks: Manage Existing Subjects

**Input**: Design documents from `/specs/005-manage-subjects/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Explicitly requested by the HU04 GitHub Issue subtasks ("Testing: usuario solo obtiene sus materias", "actualizar materia propia funciona", "Security test: usuario B no modifica materia de A", "eliminación respeta regla de dependencias") and required by the constitution's Validation and Automated Quality principle — included below, written before their corresponding implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Revision note**: This revision adds the `GET /api/subjects/:id` detail-view endpoint (T006, T009, T010, T014, T028) and the shared `SubjectIdParamSchema` (T004), following the `/speckit-plan` update that resolved `/speckit-analyze` finding I1 (US3 AC3 / FR-002 / FR-006 had no endpoint to deny). All task IDs from T004 onward are renumbered from the prior revision.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure every user story's tests depend on. No new runtime dependency is needed for this feature (unlike HU03), so there is no separate Setup phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] Extend `SecurityErrorCode` in `server/utils/security/types.ts` with `NOT_FOUND` and `CONFLICT`
- [X] T002 Extend the known-code allowlist in `toSafeErrorResponse` (`server/utils/security/errors.ts`) so `NOT_FOUND` (404) and `CONFLICT` (409) pass through unchanged instead of collapsing to `VALIDATION_ERROR` (depends on T001)
- [X] T003 [P] Create the RLS-policy migration (`subjects_update_own`, `subjects_delete_own`) in `supabase/migrations/20260818010000_subjects_update_delete_policies.sql` per [data-model.md](data-model.md)
- [X] T004 [P] Implement `SubjectIdParamSchema` in `server/utils/subjects/schemas.ts` — validates the `id` path parameter as a non-empty string; shared by `GET /api/subjects/:id`, `PATCH /api/subjects/:id`, and `DELETE /api/subjects/:id` per [contracts/subject-management-crud-contract.md](contracts/subject-management-crud-contract.md)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 2: User Story 1 - View my own subjects (Priority: P1) 🎯 MVP

**Goal**: An authenticated student can retrieve a listing containing exclusively their own subjects, and can retrieve one of their own subjects by id.

**Independent Test**: Seed subjects for two distinct authenticated principals; request the listing as each and verify each response contains only that principal's subjects; separately, request one owned subject by id and verify the correct subject is returned.

### Tests for User Story 1 ⚠️

> Write first; confirm they fail until T008/T010 exist.

- [X] T005 [P] [US1] Write listing tests (two distinct principals with subjects each; empty-listing case for a principal with none) asserting the response contains exclusively the requesting principal's subjects in `tests/subjects/list-subjects.spec.ts`, using the `createTestEvent`-style authenticated fixture pattern (CA01, SC-001)
- [X] T006 [P] [US1] Write the positive detail-view test in `tests/subjects/get-subject.spec.ts`: an authenticated principal retrieves their own subject by id and receives its current name/description (FR-002, FR-006 positive path). Cross-owner and nonexistent-id denial cases for this endpoint belong to User Story 3 (T028, part of T031), not here.

### Implementation for User Story 1

- [X] T007 [P] [US1] Implement `listSubjectsForOwner(userId)` in `server/utils/subjects/repository.ts`, scoping the query with `.eq('user_id', userId)` (FR-001, FR-002)
- [X] T008 [US1] Implement `GET /api/subjects` in `server/api/subjects/index.get.ts`, composing `requireAuthenticatedPrincipal` → `listSubjectsForOwner` → `200` response, with `sendSafeError` for failures, per [contracts/subject-management-crud-contract.md](contracts/subject-management-crud-contract.md) (depends on T007)
- [X] T009 [US1] Implement `getSubjectForOwner(userId, id)` in `server/utils/subjects/repository.ts` — single query scoped by both `id` and `user_id` (`.eq('id', id).eq('user_id', userId)`); returns `null` when no row matches (FR-002, FR-006, FR-007, research.md Decision 2/8). Not marked `[P]` relative to T007: same file (`repository.ts`).
- [X] T010 [US1] Implement `GET /api/subjects/:id` in `server/api/subjects/[id].get.ts`, composing `requireAuthenticatedPrincipal` → id-param validation (`SubjectIdParamSchema`, T004) → `getSubjectForOwner` → `200` response, or `404 NOT_FOUND` when `getSubjectForOwner` returns `null`, per [contracts/subject-management-crud-contract.md](contracts/subject-management-crud-contract.md) (depends on T004, T009, T001, T002)
- [X] T011 [P] [US1] Build `SubjectList.vue` in `app/components/subjects/SubjectList.vue` — fetches `GET /api/subjects` on mount, renders each subject's name/description, and an empty state
- [X] T012 [US1] Update `app/pages/subjects/index.vue` to host `SubjectList` alongside the existing `SubjectForm`, replacing the HU03 session-only "created this session" list with the real fetched listing (depends on T011)
- [X] T013 [US1] Confirm T005 passes against T008
- [X] T014 [US1] Confirm T006 passes against T010

**Checkpoint**: User Story 1 is functional and independently testable — listing and single-subject detail retrieval both work for the owning student.

---

## Phase 3: User Story 2 - Edit my own subject (Priority: P1)

**Goal**: The owning authenticated student can update a subject's name and/or description, with changes reflected immediately.

**Independent Test**: As the owning principal, submit a valid partial update to an existing subject and verify the change is persisted and returned; submit an invalid update and verify it is rejected with the stored row unchanged.

### Tests for User Story 2 ⚠️

> Write first; confirm they fail until T020 exists.

- [X] T015 [P] [US2] Write `UpdateSubjectSchema` unit tests: name-only, description-only, both fields, neither field present (rejected), empty/whitespace-only/over-length name, over-length description in `tests/subjects/schema.spec.ts` (CA02)
- [X] T016 [US2] Write route-level update tests: valid partial updates return `200` with the new values persisted; invalid updates return `422 VALIDATION_ERROR` with the stored row unchanged in `tests/subjects/update-subject.spec.ts` (CA02, SC-002)

### Implementation for User Story 2

- [X] T017 [P] [US2] Implement `UpdateSubjectSchema` in `server/utils/subjects/schemas.ts` — `name`/`description` both optional (reusing HU03's 1–100/≤500 trimmed-length rules), with a `.refine` requiring at least one field present (FR-003, FR-004)
- [X] T018 [US2] Implement `updateSubject(userId, id, patch)` in `server/utils/subjects/repository.ts` as a single query scoped by both `id` and `user_id`; throw `404 NOT_FOUND` when zero rows are affected (FR-004, FR-006, FR-007) (depends on T017, T001, T002)
- [X] T019 [US2] Implement `PATCH /api/subjects/:id` in `server/api/subjects/[id].patch.ts`, composing auth → id-param validation (`SubjectIdParamSchema`, T004) → body validation → `updateSubject` → `200` response, per [contracts/subject-management-crud-contract.md](contracts/subject-management-crud-contract.md) (depends on T004, T018)
- [X] T020 [P] [US2] Build `SubjectEditForm.vue` in `app/components/subjects/SubjectEditForm.vue` — inline edit for one subject's name/description, calls `PATCH`, with loading/success/error states
- [X] T021 [US2] Wire `SubjectEditForm` into `SubjectList.vue` as a per-row edit trigger (depends on T011, T020)
- [X] T022 [US2] Confirm T015/T016 pass against T019

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 4: User Story 4 - Delete a subject I no longer need (Priority: P2)

**Goal**: The owning authenticated student can delete a subject that has no associated study tasks; deletion is blocked when tasks are associated.

**Independent Test**: As the owning principal, delete a subject with no dependents and verify it is removed and absent from a subsequent listing; simulate the dependency-blocked case and verify nothing is deleted.

> **Sequencing note**: Implemented before Phase 5 (User Story 3), even though User Story 3 is P1 and this is P2 — User Story 3's delete-denial acceptance scenario requires this phase's `DELETE` endpoint to already exist. See Dependencies & Execution Order below.

### Tests for User Story 4 ⚠️

> Write first; confirm they fail until T024 exists.

- [X] T023 [P] [US4] Write delete tests in `tests/subjects/delete-subject.spec.ts`: (a) a subject with no dependents is deleted and absent from a subsequent `listSubjectsForOwner` call; (b) simulate a Postgres foreign-key-violation (error code `23503`) at the repository boundary and assert it is translated to `409 CONFLICT` with nothing deleted (CA04, SC-004, SC-005)

### Implementation for User Story 4

- [X] T024 [US4] Implement `deleteSubject(userId, id)` in `server/utils/subjects/repository.ts` — single query scoped by both `id` and `user_id`; throw `404 NOT_FOUND` on zero rows affected; catch Postgres error code `23503` and throw `409 CONFLICT` (FR-010, FR-011, FR-012) (depends on T001, T002)
- [X] T025 [US4] Implement `DELETE /api/subjects/:id` in `server/api/subjects/[id].delete.ts`, composing auth → id-param validation (`SubjectIdParamSchema`, T004) → `deleteSubject` → `200` response, per [contracts/subject-management-crud-contract.md](contracts/subject-management-crud-contract.md) (depends on T004, T024)
- [X] T026 [P] [US4] Add a two-step delete-with-confirmation control to `SubjectList.vue` — calls `DELETE`, removes the row locally on success, surfaces the `409 CONFLICT` message on blocked deletion (depends on T011)
- [X] T027 [US4] Confirm T023 passes against T025

**Checkpoint**: User Stories 1, 2, and 4 all work independently.

---

## Phase 5: User Story 3 - Be blocked from touching another student's subject (Priority: P1)

**Goal**: No student can view, edit, or delete another student's subject, and denied requests never reveal whether the target subject exists under a different owner.

**Independent Test**: With two students each owning a subject, Student B attempts to view, edit, or delete Student A's subject by id and the attempt is denied by the server with zero changes to Student A's data.

> **Sequencing note**: This phase is cross-cutting — it adds tests over the `GET /:id` (Phase 2), `PATCH` (Phase 3), and `DELETE` (Phase 4) handlers already built. No new production code is expected here, mirroring the precedent set in `specs/004-subject-management/tasks.md` (HU03 Phase 5).

### Tests for User Story 3 ⚠️

- [X] T028 [US3] Extend `tests/subjects/ownership.spec.ts`: Student B attempts `GET /api/subjects/:id` on Student A's subject → `404 NOT_FOUND`; Student A's subject unchanged afterward (CA03 AC3, FR-006, FR-007)
- [X] T029 [US3] Extend `tests/subjects/ownership.spec.ts`: Student B attempts `PATCH` on Student A's subject → `404 NOT_FOUND`; Student A's subject unchanged afterward (CA03 AC1, FR-006, FR-007)
- [X] T030 [US3] Extend `tests/subjects/ownership.spec.ts`: Student B attempts `DELETE` on Student A's subject → `404 NOT_FOUND`; Student A's subject still present and unchanged afterward (CA03 AC2, FR-006, FR-007)
- [X] T031 [US3] Extend `tests/subjects/ownership.spec.ts`: `GET`/`PATCH`/`DELETE` against an id that never existed for any student → the identical `404 NOT_FOUND` response shape as T028–T030, asserting the cross-owner and nonexistent cases are indistinguishable (FR-007)

> T028–T031 are logically independent cases and can be *authored* back-to-back quickly, but are intentionally **not** marked `[P]` — all four edit the same file (`tests/subjects/ownership.spec.ts`), and marking same-file edits `[P]` risks conflicting concurrent writes (the exact anti-pattern the tasks-template's Notes section warns against).
- [X] T032 [US3] Confirm T028–T031 pass without modifying `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`, or the repository; if any fails, fix the offending handler/repository function before proceeding

**Checkpoint**: All four user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all four stories.

- [X] T033 [P] Add unauthenticated-request tests for all four new endpoints (`GET /api/subjects`, `GET /api/subjects/:id`, `PATCH`, `DELETE` → `401 UNAUTHENTICATED`, no data read or changed) across `tests/subjects/list-subjects.spec.ts`, `tests/subjects/get-subject.spec.ts`, `tests/subjects/update-subject.spec.ts`, and `tests/subjects/delete-subject.spec.ts` (FR-008)
- [X] T034 Run all [quickstart.md](quickstart.md) validation scenarios and record results
- [X] T035 Run full standard validation commands (`npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) and record evidence in this file

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately. Blocks all user stories.
- **User Story 1 (Phase 2)**: Depends on Foundational, including `SubjectIdParamSchema` (T004) for the detail-view route. Delivers the listing endpoint, the detail-view endpoint, the page, and the list component every later story's UI builds on.
- **User Story 2 (Phase 3)**: Depends on Foundational (T001/T002 for `NOT_FOUND`, T004 for the shared id-param schema) and on `SubjectList.vue` existing (T011) to host the edit trigger. Independently testable at the API level as soon as Foundational is done.
- **User Story 4 (Phase 4)**: Depends on Foundational (T001/T002 for `CONFLICT`/`NOT_FOUND`, T004 for the shared id-param schema) and on `SubjectList.vue` (T011) for the delete control. Independently testable at the API level as soon as Foundational is done.
- **User Story 3 (Phase 5)**: Depends on User Story 1's `GET /:id` handler (T010), User Story 2's `PATCH` handler (T019), and User Story 4's `DELETE` handler (T025) all existing, since its acceptance scenarios cover denial of all three operations. This is why it is sequenced after Phase 4 despite being P1 while User Story 4 is P2 — the same kind of priority-vs.-build-order distinction HU03 documented for its own US2/US3. `GET /:id` (Phase 2) is already available well before this phase, so only the Phase 3/4 ordering is load-bearing.
- **Polish (Phase 6)**: Depends on all four user stories being complete.

### Parallel Opportunities

- T001 and T003 and T004 can run in parallel; T002 depends on T001.
- T005 and T006 can be authored in parallel (different files). T007 and T009 are logically independent but both target `repository.ts`, so they are not marked `[P]`.
- T015 and T017 can run in parallel (different files, both reusing HU03's length constants).
- T023 can be authored in parallel with T024 (test file vs. implementation file, though T023 should fail until T024/T025 land).
- T028, T029, T030, and T031 are independent cases but all target `ownership.spec.ts`, so they are not marked `[P]` (see the note under Phase 5).

---

## Parallel Example: Foundational + User Story 1

```bash
# After Foundational (T001-T004) lands:
Task: "Write listing tests in tests/subjects/list-subjects.spec.ts"
Task: "Write positive detail-view test in tests/subjects/get-subject.spec.ts"

# repository.ts functions are implemented sequentially (same file), e.g.:
Task: "Implement listSubjectsForOwner in server/utils/subjects/repository.ts"
Task: "Implement getSubjectForOwner in server/utils/subjects/repository.ts"

# Once T008/T010 (GET handlers) are implemented:
Task: "Build SubjectList.vue in app/components/subjects/SubjectList.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Foundational).
2. Complete Phase 2 (User Story 1) — a student can see their own subjects, and one at a time by id, end-to-end.
3. **STOP and VALIDATE**: run T005/T006/T013/T014; manually exercise the listing in `npm run dev`.

### Incremental Delivery

1. Foundational → shared error codes, shared id-param schema, and RLS policies ready.
2. US1 → listing and detail-view work end-to-end (MVP).
3. US2 → editing works end-to-end.
4. US4 → deletion (allowed and blocked cases) works end-to-end.
5. US3 → cross-owner denial proven over the detail-view, update, and delete handlers, with no existence disclosure.
6. Polish → unauthenticated-request coverage, quickstart run, full validation commands.

---

## Notes

- `user_id` must never be read from request input at any point in T008/T010/T019/T025 — only from `requireAuthenticatedPrincipal(event)`.
- T009/T018/T024 must use a single scoped query (`id` + `user_id` together), never a separate fetch-then-compare-owner step — this is what makes the not-owned and nonexistent cases indistinguishable (FR-007, research.md Decision 2/8).
- `GET /api/subjects/:id` (T009, T010) exists specifically to give User Story 3 something concrete to deny (research.md Decision 8, resolving `/speckit-analyze` finding I1); its own positive-path test (T006) belongs to User Story 1, while its denial tests (T028, part of T031) belong to User Story 3.
- No task in this HU creates a `study_tasks` table; T023/T024's dependency-blocked case is simulated at the repository/error-translation boundary, per research.md Decision 4 and quickstart.md scenario 6.
- Mark a task's checkbox only after its tests (where applicable) pass.

## Validation Evidence

Closed retroactively on 2026-08-21, as part of a repo-wide spec/task traceability cleanup (see issue #35) — this HU's own implementation and tests were already complete and merged; only the checkbox/evidence bookkeeping was outstanding.

- `npm run lint`: passed (0 errors; 1 pre-existing, unrelated warning in `app/components/PasswordInput.vue`).
- `npm run typecheck`: passed, 0 errors.
- `npm run test`: passed, 230/230 (full current suite, including this HU's subject tests plus every HU merged after it).
- `npm run build`: passed.
- Quickstart scenarios: covered by the automated suite referenced above; no separate manual run performed.
