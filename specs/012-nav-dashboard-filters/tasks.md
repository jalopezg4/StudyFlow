# Tasks: Navigation, Dashboard Labels & Filter Reset

**Input**: Design documents from `/specs/012-nav-dashboard-filters/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (no `contracts/` — no API contract changes, see research.md)

**Tests**: Included per the constitution's Playwright coverage gate and the testing approach fixed in research.md — extend the two existing specs (`navigation.spec.ts`, `tasks-filter-sort.spec.ts`) rather than adding new ones.

No Foundational phase: unlike most features in this repo, the three user stories below share **zero** code, types, or setup. Each is a single-file change that reuses a pattern already established in its own file (see research.md), so there is nothing blocking or shared to build first.

## Phase 1: User Story 1 - Reach Study Sessions from anywhere (Priority: P1) 🎯 MVP

**Goal**: The persistent nav lists Study Sessions alongside Dashboard/My Subjects/My Tasks, with matching active-state styling.

**Independent Test**: From any authenticated page other than Dashboard, use the nav to reach `/study-sessions` directly; confirm the link is marked active while there.

- [X] T001 [US1] Add a `{ label: 'Study Sessions', path: '/study-sessions' }` entry to the `links` array in `app/components/AppNav.vue`
- [X] T002 [US1] Add Playwright assertions for the new nav link's presence on another page and its active-state styling on `/study-sessions` to `tests/e2e/navigation.spec.ts`

**Checkpoint**: User Story 1 is fully functional and testable on its own.

---

## Phase 2: User Story 2 - Understand what a dashboard quick-link actually does (Priority: P2)

**Goal**: The Dashboard's three quick-link labels read as management views, not creation-only actions — with zero change to where they navigate.

**Independent Test**: Read the three quick-link labels without clicking; confirm none implies "creation only". Click each; confirm destinations (`/subjects`, `/tasks`, `/study-sessions`) are unchanged.

- [X] T003 [US2] Replace the "Create subject" / "Create task" / "Record study session" labels in `app/pages/dashboard.vue` with management-view wording (e.g. "My Subjects" / "My Tasks" / "Study Sessions"), without changing any `to=` target, icon, or class
- [X] T004 [US2] Add Playwright assertions for the new quick-link label text, and confirm all three destinations (`/subjects`, `/tasks`, `/study-sessions`) are unchanged, to `tests/e2e/navigation.spec.ts`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 3: User Story 3 - Recover from an over-filtered task list (Priority: P3)

**Goal**: An always-visible "Clear filters" action resets status/subject/sort to defaults and reloads the task list in one step.

**Independent Test**: Apply filters (including a combination with zero results) to the task list, then use the always-visible "Clear filters" action to return to the full, unfiltered list in one click.

- [X] T005 [US3] Add an always-visible "Clear filters" button to the filters toolbar in `app/components/tasks/TaskList.vue` that resets `filters.status`, `filters.subjectId`, `filters.sortBy`, `filters.sortDir` to their initial defaults and calls the existing `loadTasks()`
- [X] T006 [US3] Add Playwright assertions for "Clear filters" being always visible, resetting all three filters in one action, being a harmless no-op with none active, and still landing on the default unfiltered view when clicked while a previous filter change is still loading, to `tests/e2e/tasks-filter-sort.spec.ts`

**Checkpoint**: All three user stories are independently functional.

---

## Phase 4: Polish and validation

- [X] T007 [P] Run the quickstart.md scenarios manually and record results in `specs/012-nav-dashboard-filters/tasks.md` (Validation Evidence section)
- [X] T008 Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, and `npm run build`; record results in `specs/012-nav-dashboard-filters/tasks.md` (Validation Evidence section)

## Validation Evidence

- `npm run lint`: passed with one pre-existing warning in `app/components/PasswordInput.vue` (unrelated to this feature).
- `npm run typecheck`: passed.
- `npm run test`: passed, 30 files and 264 tests.
- `npm run build`: passed; production build completed successfully.
- `npm run test:e2e`: passed, 48/48 tests (chromium + firefox), including the extended `navigation.spec.ts` (US1 nav link + active state, US2 label/destination assertions) and `tasks-filter-sort.spec.ts` (US3 always-visible/reset/no-op/mid-request Clear filters). Full suite run confirms no regressions elsewhere (SC-004).
- quickstart.md scenarios (User Stories 1-3) were validated as part of the same Playwright run above — each scenario in quickstart.md corresponds 1:1 to an assertion added in this implementation.

## Dependencies and Parallel Work

- US1, US2, and US3 touch three disjoint files (`AppNav.vue`, `dashboard.vue`, `TaskList.vue`) and their own disjoint test edits (`navigation.spec.ts` is shared by US1+US2 only — see note below). None of the three stories depends on another; all can be implemented, tested, and merged in any order, including fully in parallel by three different people.
- **Note**: T002 (US1) and T004 (US2) both edit `tests/e2e/navigation.spec.ts`. If US1 and US2 are built by different people in parallel, coordinate that one file (e.g. do T002 and T004 as two small, quick-to-rebase commits, or have one person add both test assertions) — this is the only file touched by more than one task in this feature.
- Within each story, the implementation task should land before its own test task, since the test asserts the exact wording/behavior chosen during implementation.

## Parallel Example

```bash
# Three people, three stories, starting from main simultaneously:
Person A: T001 -> T002   # app/components/AppNav.vue + tests/e2e/navigation.spec.ts
Person B: T003 -> T004   # app/pages/dashboard.vue + tests/e2e/navigation.spec.ts
Person C: T005 -> T006   # app/components/tasks/TaskList.vue + tests/e2e/tasks-filter-sort.spec.ts
```

## MVP Scope

T001-T002 (User Story 1) alone is a deployable MVP: it closes the highest-impact, every-page discoverability gap with a two-line change. T003-T004 and T005-T006 each add further independent value and can ship in any order after or alongside it. T007-T008 close out validation once all three (or however many are in scope for a given release) are merged.
