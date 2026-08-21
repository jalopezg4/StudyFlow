# Tasks: Filter and Sort Study Tasks

**Input**: Design documents from `/specs/007-filter-sort-study-tasks/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Add the allow-list validation schema and the query-building capability every user story depends on. No user story is independently testable until this phase is complete.

- [X] T001 [P] Add `TaskListQuerySchema` to `server/utils/tasks/schemas.ts`: `status` (`z.enum(['pending','completed'])`, optional), `subjectId` (`z.string().uuid()`, optional), `sortBy` (`z.enum(['dueDate','createdAt','title'])`, optional), `sortDir` (`z.enum(['asc','desc'])`, optional), plus a `.refine()` rejecting `sortDir` supplied without `sortBy` — per [data-model.md](data-model.md) and research.md Decisions 2, 3, 5
- [X] T002 [P] Extend `listStudyTasksForOwner` in `server/utils/tasks/repository.ts` to accept optional `filter: { status?, subjectId? }` and `sort: { by, direction }` parameters: apply `.eq('status', ...)`/`.eq('subject_id', ...)` only for supplied filters (AND semantics), map `sort.by` through a fixed `Record<SortBy, string>` column lookup to `.order()` (never a raw string), apply the per-criterion default direction table when `sort` is supplied without an explicit direction, and always append `.order('id', { ascending: true })` as the final tiebreaker — including on the no-args call, which must otherwise reproduce HU06's exact prior query (research.md Decisions 4, 5, 6, 7)
- [X] T003 Update `handleListStudyTasks` in `server/api/tasks/index.get.ts` to call `validateWithSchema(TaskListQuerySchema, getQuery(event), 'query')` immediately after `requireAuthenticatedPrincipal`/`requireRequestSupabaseClient` and before calling `listStudyTasksForOwner`, translating the validated query into the `filter`/`sort` arguments from T002 (depends on T001, T002)

**Checkpoint**: Filter/sort capability is fully wired end-to-end; ready for story-specific test coverage.

---

## Phase 2: User Story 1 - Filter my task listing by a supported attribute (Priority: P1) 🎯 MVP

**Goal**: An authenticated student can narrow their task listing by `status` and/or `subjectId`, seeing only their own matching tasks.

**Independent Test**: With tasks in multiple statuses/subjects, apply `?status=pending` (and separately `?subjectId=<owned>`) and verify only matching, self-owned tasks return — never another student's tasks, and an empty array for a subject the student doesn't own or a filter matching nothing.

- [X] T004 [P] [US1] Add filter cases to `tests/tasks/list-tasks.spec.ts`: `?status=pending`/`?status=completed` return only matching own tasks; `?subjectId=<owned-subject>` returns only that subject's own tasks; `?subjectId=<subject-owned-by-another-student>` returns an empty array (not that student's data, not an error); `?status=` + `?subjectId=` together return only tasks matching both (AND semantics); a filter matching none of the student's tasks returns a valid empty array — implemented as route-level query→filter translation tests, with the actual filtering behavior (real AND semantics, unowned/nonexistent-subject empty results) verified against the real `listStudyTasksForOwner` in the new `tests/tasks/list-tasks-repository.spec.ts` (in-memory Supabase query-builder fake; see Notes)
- [X] T005 [US1] Confirm T004 passes against T002/T003

**Checkpoint**: A student can filter their own tasks by status and/or subject, independently of sorting.

---

## Phase 3: User Story 2 - Sort my task listing by a supported criterion (Priority: P1)

**Goal**: An authenticated student can order their task listing by `dueDate`, `createdAt`, or `title`, ascending or descending, with deterministic tiebreaking and an unchanged default when no sort is requested.

**Independent Test**: With tasks having different due dates, request `?sortBy=dueDate&sortDir=asc` and verify soonest-due-first order; request `sortDir=desc` and verify the exact reverse; request no sort params and verify HU06's existing default (most recently created first) is unchanged.

- [X] T006 [P] [US2] Add sort cases to `tests/tasks/list-tasks.spec.ts`: `?sortBy=dueDate&sortDir=asc` and `=desc` (including tasks with a `null` due date); `?sortBy=dueDate` alone defaults to ascending; `?sortBy=createdAt` alone defaults to descending; `?sortBy=title` alone defaults to ascending, and both directions explicitly; two tasks tied on the active sort criterion resolve deterministically via the `id` tiebreaker across repeated identical requests; no `sortBy`/`sortDir` at all reproduces HU06's exact prior default order — route-level translation tests in `list-tasks.spec.ts`, actual ordering/tiebreaker/default-direction behavior verified in `tests/tasks/list-tasks-repository.spec.ts`
- [X] T007 [US2] Confirm T006 passes against T002/T003

**Checkpoint**: A student can sort their own tasks by any supported criterion and direction, independently of filtering.

---

## Phase 4: User Story 3 - Reject unsupported filter or sort values safely (Priority: P1)

**Goal**: Any filter/sort query parameter outside the allow-list is rejected as a validation error before any database access, with zero task data returned and zero data altered; unauthenticated requests are rejected before validation even runs.

**Independent Test**: Submit a filter value, sort field, or sort direction not on the supported list and verify a validation error with no task data in the response body and no stored data changed; submit an unauthenticated request with filter/sort params and verify it is denied before any filter/sort logic executes.

- [X] T008 [P] [US3] Add `TaskListQuerySchema` unit cases to `tests/tasks/schema.spec.ts`: unsupported `status` value, a case-variant value (e.g. `Pending`), unsupported `sortBy`, unsupported `sortDir`, malformed `subjectId` (not a UUID), `sortDir` supplied without `sortBy`, and a repeated/array-valued `status` query parameter — all rejected
- [X] T009 [P] [US3] Add route-level rejection cases to `tests/tasks/list-tasks.spec.ts`: each unsupported/malformed query combination above returns `422 VALIDATION_ERROR` with no `tasks` field in the response body; an unauthenticated request carrying filter/sort query parameters returns `401 UNAUTHENTICATED`
- [X] T010 [US3] Confirm T008/T009 pass against T001/T003

**Checkpoint**: No malformed or unsupported filter/sort input can reach query construction or bypass authentication.

---

## Phase 5: User Story 4 - Combine a filter and a sort criterion (Priority: P2)

**Goal**: A supported filter and a supported sort criterion applied together in one request produce a result set that satisfies both simultaneously; a valid filter paired with an unsupported sort value (or vice versa) rejects the entire request rather than partially applying the valid half.

**Independent Test**: Submit `?status=pending&sortBy=dueDate&sortDir=asc` and verify every returned task has `status: pending`, ordered by `dueDate` ascending; submit `?status=pending&sortBy=not-a-real-field` and verify the whole request is rejected, not partially filtered.

- [X] T011 [P] [US4] Add combination cases to `tests/tasks/list-tasks.spec.ts`: `?status=pending&sortBy=dueDate&sortDir=asc` returns only pending tasks ordered by due date ascending; a request mixing one valid parameter with one unsupported parameter (in each direction — valid filter + invalid sort, and invalid filter + valid sort) is rejected in full, with no partial filtering/sorting applied — route-level translation/rejection in `list-tasks.spec.ts`, real simultaneous filter+sort behavior verified in `list-tasks-repository.spec.ts`
- [X] T012 [US4] Confirm T011 passes against T002/T003

**Checkpoint**: All four user stories work independently and together — filtering, sorting, rejection, and their combination are all correct and ownership-isolated.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T013 Run all [quickstart.md](quickstart.md) validation scenarios and record results
- [X] T014 Run full standard validation commands (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) and record evidence in this file

---

## Notes

- No new routes, tables, migrations, or UI components — a pure query-parameter extension of the existing `GET /api/tasks` (see plan.md Decision 8 / research.md).
- `user_id` must never be read from request input at any point — only from `requireAuthenticatedPrincipal(event)`, unchanged from HU06.
- No due-date range filter ("overdue"/"due this week") and no recommendation/prioritization logic in this feature (spec.md Assumptions; that is HU08's scope).
- `tests/security/fixtures.ts`'s `createTestEvent` was extended with an optional `query` parameter (sets a fake `event.path` so h3's `getQuery` resolves it) — a shared, backward-compatible fixture change; all pre-existing call sites (no third argument) are unaffected.
- A new `tests/tasks/list-tasks-repository.spec.ts` was added beyond the two files named in the original plan/tasks. `list-tasks.spec.ts` mocks `listStudyTasksForOwner` entirely (as it always has, for route-level tests), so it can only verify the route correctly *translates* query params into `filter`/`sort` arguments — not that the real Supabase query construction (column mapping, default directions, `id` tiebreaker, actual AND-filtering) is correct. The new file exercises the real `listStudyTasksForOwner` against a small in-memory fake Supabase query builder (records `.eq()`/`.order()` and applies them over a fixture row set) to give genuine automated coverage of FR-003/004/009/011/012/013, which this feature's core value depends on. Real Postgres/RLS behavior remains deferred to manual/live-instance testing, consistent with HU06.
- Addressed both `/speckit-analyze` findings from this feature's prior analysis pass: the dangling `data-model.md` → contract cross-reference for NULL due-date ordering (I001) was resolved by adding an explicit "NULL due-date ordering" section to the contract; the nonexistent-(but well-formed)-subjectId case (U001) was added to `list-tasks-repository.spec.ts`.

## Validation Evidence

- `npm ci`: required once to fill a pre-existing gap in this environment's `node_modules` (`@tailwindcss/vite` was declared in `package.json`/`package-lock.json` but not installed) — unrelated to this feature's code, needed for `typecheck`/`build` to run at all.
- `npm run lint`: passed (0 errors; 1 pre-existing warning in `app/components/PasswordInput.vue`, unrelated — same warning HU06 noted).
- `npm run typecheck`: passed, no errors (run with `NUXT_TELEMETRY_DISABLED=1`).
- `npm run test`: passed (22 files, 215 tests — 46 new for this feature: 14 `TaskListQuerySchema` cases in `schema.spec.ts`, 17 route-level translation/rejection/combination cases in `list-tasks.spec.ts`, 15 real filter/sort/tiebreaker/combination cases against the actual repository function in the new `list-tasks-repository.spec.ts`; all pre-existing tests in `tests/tasks/` — 129 total in that directory now — remain green).
- `npm run build`: passed; the Nitro route manifest confirms `GET /api/tasks` (`index2.get.mjs`) built successfully alongside the other unchanged task/subject routes.
- Manual smoke test against `npm run dev` / live Supabase: not exercised in this environment, same pre-existing limitation noted in every prior HU (no local Supabase project configured). Real NULL-ordering behavior against live PostgreSQL and RLS enforcement itself remain unexercised here, consistent with HU05/HU06's own acknowledged gaps.
- Quickstart scenarios (quickstart.md): all four validated via the automated suite above — US1 filter cases (`list-tasks.spec.ts` + `list-tasks-repository.spec.ts`), US2 sort cases (same), US3 rejection cases (`schema.spec.ts` + `list-tasks.spec.ts`), US4 combination cases (same). No manual/live-server run performed, for the reason above.
