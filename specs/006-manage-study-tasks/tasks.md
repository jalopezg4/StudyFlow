# Tasks: Manage Study Tasks

**Input**: Design documents from `/specs/006-manage-study-tasks/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Foundational (Blocking Prerequisites)

- [x] T001 Create the `study_tasks` UPDATE/DELETE RLS policies migration in `supabase/migrations/20260820000000_study_tasks_update_delete_policies.sql` per [data-model.md](data-model.md)
- [x] T002 [P] Add `TaskIdParamSchema` and `UpdateStudyTaskSchema` (Zod: title/description/dueDate reuse HU05's rules, `status` enum `pending`/`completed`, all optional, refine requiring ≥1 field) to `server/utils/tasks/schemas.ts`
- [x] T003 Retrofit `createStudyTask` and add `listStudyTasksForOwner`, `getStudyTaskForOwner`, `updateStudyTask`, `deleteStudyTask` to `server/utils/tasks/repository.ts`, all using an injected `SupabaseClient` (request-scoped) instead of a service-role client (research.md Decision 3)
- [x] T004 Update `server/api/tasks/index.post.ts` to pass `requireRequestSupabaseClient(event)` into the retrofitted `createStudyTask`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 2: User Story 1 - View my own study tasks (Priority: P1) 🎯 MVP

- [x] T005 [P] [US1] Write listing tests (only-own-tasks, empty result, cross-student isolation) in `tests/tasks/list-tasks.spec.ts`
- [x] T006 [US1] Implement `GET /api/tasks` in `server/api/tasks/index.get.ts` (auth → client → `listStudyTasksForOwner`)
- [x] T007 [US1] Confirm T005 passes against T006

**Checkpoint**: A student can list their own tasks end-to-end.

---

## Phase 3: User Story 2 - Edit my own study task (Priority: P1)

- [x] T008 [P] [US2] Write `UpdateStudyTaskSchema` unit tests (partial combinations, empty body rejected, invalid title/description/dueDate/status) in `tests/tasks/schema.spec.ts`
- [x] T009 [P] [US2] Write update tests (title/description/dueDate/status independently and combined, validation rejection, untouched-fields-preserved) in `tests/tasks/update-task.spec.ts`
- [x] T010 [US2] Implement `PATCH /api/tasks/:id` in `server/api/tasks/[id].patch.ts` (auth → client → parse id → validate body → `updateStudyTask`)
- [x] T011 [US2] Build `TaskEditForm.vue` in `app/components/tasks/TaskEditForm.vue` (title/description/dueDate fields + status toggle)
- [x] T012 [US2] Confirm T008/T009 pass against T010

**Checkpoint**: A student can edit any field of their own task, including marking it complete/pending.

---

## Phase 4: User Story 3 - Be blocked from touching another student's study task (Priority: P1)

- [x] T013 [US3] Write detail-view test (owned task retrievable) in `tests/tasks/get-task.spec.ts`
- [x] T014 [US3] Implement `GET /api/tasks/:id` in `server/api/tasks/[id].get.ts` (auth → client → parse id → `getStudyTaskForOwner` → 404 if null)
- [x] T015 [US3] Extend `tests/tasks/ownership.spec.ts` with cross-owner denial (view/edit/delete) and nonexistent-id cases, all asserting identical `404 NOT_FOUND`
- [x] T016 [US3] Confirm T013/T015 pass against T014/T010 and the delete handler from Phase 5

**Checkpoint**: No task is ever viewable, editable, or deletable by anyone other than its owner.

---

## Phase 5: User Story 4 - Delete a study task I no longer need (Priority: P2)

- [x] T017 [P] [US4] Write delete tests (successful delete removes from listing, repeat/nonexistent delete denied) in `tests/tasks/delete-task.spec.ts`
- [x] T018 [US4] Implement `DELETE /api/tasks/:id` in `server/api/tasks/[id].delete.ts` (auth → client → parse id → `deleteStudyTask`)
- [x] T019 [US4] Build `TaskList.vue` in `app/components/tasks/TaskList.vue` (fetch + render, inline edit via `TaskEditForm`, status toggle, delete with confirmation)
- [x] T020 [US4] Extend `app/pages/tasks/index.vue` to host `TaskList` alongside the existing `TaskForm`
- [x] T021 [US4] Confirm T017 passes against T018

**Checkpoint**: All four user stories work independently and together — full CRUD on study tasks, ownership-isolated.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T022 [P] Update `tests/tasks/create-task.spec.ts` and `tests/tasks/ownership.spec.ts` create-path mocks/assertions for the retrofitted `createStudyTask(supabase, userId, input)` signature
- [x] T023 Run all [quickstart.md](quickstart.md) validation scenarios and record results
- [x] T024 Run full standard validation commands (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) and record evidence in this file

---

## Notes

- No filtering/sorting/recommendation/session-tracking/dashboard work in this HU (HU07-HU10).
- `user_id` must never be read from request input at any point in any handler — only from `requireAuthenticatedPrincipal(event)`.

## Validation Evidence

- `npm run lint`: passed (0 errors; 1 pre-existing warning in `app/components/PasswordInput.vue`, unrelated).
- `npm run typecheck`: passed (run with `NUXT_TELEMETRY_DISABLED=1`).
- `npm run test`: passed (21 files, 162 tests — 44 new/extended for this feature, 118 pre-existing unaffected).
- `npm run build`: passed; confirmed via the built Nitro route manifest that all four new/retrofitted routes registered correctly (`GET /api/tasks`, `GET /api/tasks/:id`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`, plus the existing `POST /api/tasks`).
- Manual smoke test against `npm run dev`: same pre-existing, environment-wide limitation as HU05/HU03 (no local Supabase project configured, so every route 500s equally) — not specific to this feature. Not exercised in this environment: the migration SQL against a live Postgres instance, and RLS policy enforcement itself (mocked at the repository boundary in all automated tests).
