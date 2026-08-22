# Phase 0 Research: Navigation, Dashboard Labels & Filter Reset

No items in Technical Context were marked `NEEDS CLARIFICATION` — this feature reuses established patterns already present in the three files it touches. The "research" below documents which existing pattern each user story reuses and why, so Phase 1 design and `/speckit-tasks` don't have to re-derive it.

## User Story 1 — Study Sessions nav link

**Decision**: Add one entry, `{ label: 'Study Sessions', path: '/study-sessions' }`, to the existing `links` array in `app/components/AppNav.vue`. Do not add a separate, hand-written `<NuxtLink>`.

**Rationale**: `AppNav.vue` already renders all nav links from a single `links` array via `v-for`, with active-state styling driven by one shared `:class="route.path === link.path ? ... : ..."` expression. Adding a fourth array entry means the new link automatically gets the same active/inactive styling, hover states, and layout as Dashboard/My Subjects/My Tasks — with zero new template logic.

**Alternatives considered**: A hand-added `<NuxtLink>` outside the `v-for` — rejected because it would duplicate the active-state class logic and immediately drift out of sync if that logic ever changes.

## User Story 2 — Dashboard quick-link labels

**Decision**: Change only the text content of the three existing `<NuxtLink>` elements in `app/pages/dashboard.vue` (currently "Create subject", "Create task", "Record study session"). Leave every `to=`, class, and icon untouched.

**Rationale**: FR-004 requires the destination and behavior to stay identical — this is a copy-only change. The three links already point at the correct management views (`/subjects`, `/tasks`, `/study-sessions`); only the words describing them are wrong.

**Alternatives considered**: Extracting the quick-links into a shared/reusable component — rejected as unnecessary complexity for a three-string text change, and it would touch more of the file than needed for an otherwise trivial fix.

## User Story 3 — Clear filters

**Decision**: Add a "Clear filters" `<button>` in the existing filters toolbar `<div>` in `app/components/tasks/TaskList.vue`, always rendered (per the resolved clarification) next to the Status/Subject/Sort controls. Its click handler resets the local `filters` reactive object (`status`, `subjectId`, `sortBy`, `sortDir`) to its original initial values and calls the existing `loadTasks()` — the same function already wired to every filter `<select>`'s `@change` handler.

**Rationale**: `TaskList.vue` already owns `filters` as a single `reactive()` object and already has one function, `loadTasks()`, that reads it and re-fetches. Reset-and-refetch is therefore a two-line handler with no new state, no new fetch call shape, and no risk of the button's result state diverging from what the dropdowns would produce if reset by hand.

**Alternatives considered**: A full page reload to reset filters — rejected as unnecessarily heavy, would discard scroll position, and doesn't match how any other reset/cancel action in this app behaves.

## Testing approach

**Decision**: Extend the existing Playwright specs that already cover these two screens — `tests/e2e/navigation.spec.ts` for User Story 1, `tests/e2e/tasks-filter-sort.spec.ts` for User Story 3 — rather than creating new spec files. Dashboard label text (User Story 2) is asserted directly since no existing dashboard e2e spec covers the quick-link labels; add the assertions to `navigation.spec.ts`, which already exercises the dashboard as part of its persistent-nav coverage.

**Rationale**: All three user stories are additive changes to screens with existing E2E coverage; reusing those specs keeps the new assertions next to the related, already-passing ones instead of creating parallel/duplicate spec files a future reader would have to reconcile.

**Alternatives considered**: New component-level Vitest tests for each file — not needed here since there is no business logic to unit-test in isolation (no computed value, no branching business rule); the observable behavior in all three cases is DOM output and a network call already covered by Playwright's real-browser assertions.
