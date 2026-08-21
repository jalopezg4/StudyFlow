# Tasks: Study Task Recommendation

**Input**: Design documents from `/specs/008-study-task-recommendation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Implement the one new route and its one new repository query every user story depends on. No user story is independently testable until this phase is complete.

- [X] T001 [P] Add `getRecommendedTaskForOwner(supabase, userId)` to `server/utils/tasks/repository.ts`: `.from('study_tasks').select(TASK_COLUMNS).eq('user_id', userId).eq('status', 'pending').order('due_date', { ascending: true }).order('created_at', { ascending: true }).order('id', { ascending: true }).limit(1).maybeSingle()`, mapping the row through the existing `toStudyTask` and returning `StudyTask | null` — per research.md Decisions 2, 3, 4
- [X] T002 Implement `GET /api/tasks/recommendation` in `server/api/tasks/recommendation.get.ts`: `requireAuthenticatedPrincipal(event)` → `requireRequestSupabaseClient(event)` → `getRecommendedTaskForOwner(supabase, principal.userId)` → return `{ status: 'ok', task }` (no request validation needed — no body/query params, research.md Decision 5) (depends on T001)

**Checkpoint**: The recommendation endpoint is fully wired end-to-end; ready for story-specific test coverage.

---

## Phase 2: User Story 1 - Get told what to study next (Priority: P1) 🎯 MVP

**Goal**: An authenticated student with eligible tasks gets back the single highest-priority one, computed by the documented Prioritization Rule, with completed tasks never eligible.

**Independent Test**: With several pending tasks (and some completed ones mixed in), request a recommendation and verify the response is exactly one task, it is never completed, and it matches the task the Prioritization Rule identifies as highest priority; repeating the request against unchanged data returns the same task every time.

- [X] T003 [P] [US1] Add ranking cases to `tests/tasks/recommendation-repository.spec.ts` (new file, in-memory fake Supabase query builder per `tests/tasks/list-tasks-repository.spec.ts`'s pattern): soonest due date wins over a later one; a task with no due date only wins when no eligible dated task exists; a tie on identical due dates resolves by oldest `createdAt` then by `id`; a tie among multiple undated tasks resolves the same way; a single eligible task is always returned; a `completed` task that would otherwise rank highest by due date is skipped in favor of the next eligible `pending` task; **and** an explicit determinism case that calls `getRecommendedTaskForOwner` twice against the same unchanged dataset (including a tied case) and asserts both calls return the identical task (FR-003, SC-002), mirroring the repeated-call pattern already established in `list-tasks-repository.spec.ts`
- [X] T004 [P] [US1] Add a success-path case to `tests/tasks/recommendation.spec.ts` (new file, repository mocked per `tests/tasks/list-tasks.spec.ts`'s pattern): `GET /api/tasks/recommendation` returns `200` with the mocked task in the `task` field
- [X] T005 [US1] Confirm T003/T004 pass against T001/T002

**Checkpoint**: A student gets the correct single recommendation, with completed tasks always excluded.

---

## Phase 3: User Story 2 - See a clear "nothing to recommend" response (Priority: P1)

**Goal**: A student with no eligible tasks — none at all, or all completed — gets a valid empty-state response, never an error.

**Independent Test**: A student with zero tasks, and separately a student whose only tasks are all completed, each request a recommendation and get back the identical valid empty-state result.

- [X] T006 [P] [US2] Add empty-state cases to both `tests/tasks/recommendation-repository.spec.ts` (zero tasks; all tasks completed — both resolve to `null`) and `tests/tasks/recommendation.spec.ts` (mocked repository returns `null` → route responds `200` with `{ task: null }`, not an error)
- [X] T007 [US2] Confirm T006 passes against T001/T002

**Checkpoint**: An empty or fully-completed task list produces a clean, valid "nothing to recommend" result.

---

## Phase 4: User Story 3 - Never see another student's task recommended to me (Priority: P1)

**Goal**: A recommendation is always computed exclusively from the requesting student's own tasks, and an unauthenticated request is rejected before any task is evaluated.

**Independent Test**: With tasks seeded for two students, each student's recommendation only ever returns their own task, never the other's, even when the other student's task would rank higher under the Prioritization Rule in isolation; an unauthenticated request is denied before any data access.

- [X] T008 [P] [US3] Add a cross-student isolation case to `tests/tasks/recommendation-repository.spec.ts`: seed tasks for two different `userId`s where the other student's task would rank higher by due date, and confirm each student's own call only ever returns their own task
- [X] T009 [P] [US3] Add an unauthenticated-rejection case to `tests/tasks/recommendation.spec.ts`: a request with no authenticated principal returns `401 UNAUTHENTICATED` and the repository function is never called
- [X] T010 [US3] Confirm T008/T009 pass against T001/T002

**Checkpoint**: All three user stories work independently and together — recommendation, empty-state, and ownership isolation are all correct.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T011 Run all [quickstart.md](quickstart.md) validation scenarios and record results
- [X] T012 Run full standard validation commands (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) and record evidence in this file

---

## Notes

- No new routes beyond `GET /api/tasks/recommendation`, no new tables, no migrations, no Zod schema, no UI components (plan.md Decision 6 / research.md).
- `user_id` must never be read from request input — only from `requireAuthenticatedPrincipal(event)`, unchanged from every prior HU.
- No study-session tracking, dashboards, or any HU09/HU10 scope in this feature (spec.md Assumptions).

## Validation Evidence

- `npm run lint`: passed (0 errors; 1 pre-existing warning in `app/components/PasswordInput.vue`, unrelated).
- `npm run typecheck`: passed, no errors, after fixing a real regression it surfaced: adding a new static `server/api/tasks/recommendation.get.ts` sibling to the dynamic `[id].delete.ts`/`[id].patch.ts`/`[id].get.ts` routes narrowed the Nuxt-inferred method set for `$fetch` calls using the `/api/tasks/${id}` template literal *without* an explicit generic type argument (TypeScript's route-map matching treated `recommendation` as a possible substitution for `${id}`, intersecting its `GET`-only method set with the dynamic route's `{get,patch,delete}`). Fixed in `app/components/tasks/TaskList.vue`'s `confirmDelete` by adding an explicit `$fetch<{ status: string, id: string }>(...)` type argument, matching the pattern already used by the other two `$fetch` calls in the same file (which were unaffected because they already specified a generic). This is a real, if narrow, ripple effect worth knowing about for any future static route added under `server/api/tasks/`.
- `npm run test`: passed (24 files, 228 tests — 13 new for this feature: 10 in `tests/tasks/recommendation-repository.spec.ts` (ranking, empty-state, ownership isolation, cross-repeated-request determinism) and 3 in `tests/tasks/recommendation.spec.ts` (success path, empty state, unauthenticated rejection); all 215 pre-existing tests remain green).
- `npm run build`: passed; the Nitro route manifest confirms `GET /api/tasks/recommendation` (`recommendation.get.mjs`) registered as its own route alongside the existing task routes, with no runtime routing ambiguity against `GET /api/tasks/:id` (the TypeScript-level narrowing above was a compile-time inference quirk only, not a real routing conflict — Nitro's actual router correctly prioritizes the static `recommendation` segment).
- Manual smoke test against `npm run dev` / live Supabase: not exercised in this environment, same pre-existing limitation noted in every prior HU. No new E2E spec was added, consistent with plan.md Decision 6 (no UI in this iteration, matching the spec's request/response-only scope).
