# Tasks: Study Progress Dashboard

**Input**: Design documents from `/specs/010-progress-dashboard/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Foundational

- [x] T001 [P] Define `ProgressSummary` and source row types in `server/utils/dashboard/repository.ts`
- [x] T002 [P] Add the dashboard progress response contract and runnable scenarios in `specs/010-progress-dashboard/contracts/dashboard-progress-contract.md` and `specs/010-progress-dashboard/quickstart.md`
- [x] T003 [P] Add repository tests for task/session aggregation and percentage calculation in `tests/dashboard/progress-repository.spec.ts`

## Phase 2: User Story 1 - View my progress summary (Priority: P1)

- [x] T004 [US1] Implement owner-scoped task and session aggregation in `server/utils/dashboard/repository.ts`
- [x] T005 [US1] Implement protected `GET /api/dashboard/progress` in `server/api/dashboard/progress.get.ts`
- [x] T006 [US1] Add route tests for populated progress and safe aggregation failure in `tests/dashboard/progress.spec.ts`
- [x] T007 [US1] Replace the dashboard placeholder with typed loading, populated metrics, and navigation states in `app/pages/dashboard.vue`

## Phase 3: User Story 2 - See a valid empty state (Priority: P1)

- [x] T008 [P] [US2] Add empty tasks, empty sessions, and task-only activity cases in `tests/dashboard/progress-repository.spec.ts`
- [x] T009 [US2] Add empty-state rendering and zero-metric assertions in `tests/dashboard/progress.spec.ts`
- [x] T010 [US2] Render the empty dashboard message from `hasActivity` in `app/pages/dashboard.vue`

## Phase 4: User Story 3 - Preserve data isolation (Priority: P1)

- [x] T011 [P] [US3] Add owner-scoped aggregation and unauthenticated route cases in `tests/dashboard/progress-repository.spec.ts` and `tests/dashboard/progress.spec.ts`
- [x] T012 [US3] Confirm every dashboard source query uses the authenticated owner and request-scoped Supabase client in `server/utils/dashboard/repository.ts`
- [x] T013 [US3] Add direct private dashboard/progress access coverage to `tests/e2e/dashboard.spec.ts`

## Phase 5: Polish and validation

- [ ] T014 Run the quickstart scenarios and record populated, empty, and two-user evidence in `specs/010-progress-dashboard/quickstart.md`
- [x] T015 Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`; record results in this file

## Validation Evidence

- `npm run lint`: passed with one pre-existing warning in `app/components/PasswordInput.vue`.
- `npm run typecheck`: passed.
- `npm run test`: passed, 29 files and 259 tests.
- `npm run build`: passed; dashboard page and progress API route are included in the production output.
- `npx playwright test tests/e2e/dashboard.spec.ts --list`: passed, six tests discovered.
- T014 remains open until the populated, empty, and two-user dashboard scenarios are executed against live Supabase/RLS.

## Dependencies and Parallel Work

- T001, T002, and T003 can proceed in parallel.
- T004 and T006 can proceed in parallel after the repository contract is fixed.
- T008 and T011 can proceed in parallel with UI work after the route shape is stable.
- T007, T009, and T010 share the dashboard page and should be sequenced to avoid conflicts.

## MVP Scope

T001-T007 deliver the populated dashboard summary. T008-T013 complete empty-state, ownership, and browser coverage. T014-T015 close validation and release readiness.
