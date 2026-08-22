# Quickstart: Navigation, Dashboard Labels & Filter Reset

Manual/E2E validation steps for the three user stories in [spec.md](./spec.md). No `contracts/` directory exists for this feature — none of the three fixes adds or changes an API contract (see [research.md](./research.md)).

## Prerequisites

- Dependencies installed: `npm ci`
- Local Supabase-backed dev environment configured (`.env` with `NUXT_PUBLIC_SUPABASE_URL` / `NUXT_PUBLIC_SUPABASE_ANON_KEY`), same as any other local run of this app
- Dev server running: `npm run dev`
- An authenticated test account (register via `/register`, or reuse the Playwright helper `registerAndLandOnDashboard` from `tests/e2e/helpers.ts`)

## User Story 1 — Study Sessions reachable from the nav

1. Log in and land on `/dashboard`.
2. Navigate to `/subjects` (or any authenticated page other than the dashboard).
3. **Expected**: the persistent nav bar shows a "Study Sessions" link alongside Dashboard, My Subjects, and My Tasks.
4. Click it. **Expected**: you land on `/study-sessions`.
5. While on `/study-sessions`, look at the nav again. **Expected**: the Study Sessions link is visually marked active, the same way My Subjects/My Tasks are marked active on their own pages.

Matches spec Acceptance Scenarios 1-3 under User Story 1, and Success Criterion SC-001.

## User Story 2 — Accurate dashboard labels

1. Log in and land on `/dashboard`.
2. Read the three quick-link labels without clicking them.
3. **Expected**: none of them reads as a creation-only action (e.g. not "Create subject"/"Create task"/"Record study session"); each communicates a full management view.
4. Click each link in turn. **Expected**: destinations are unchanged from before this feature (`/subjects`, `/tasks`, `/study-sessions`).

Matches spec Acceptance Scenarios 1-4 under User Story 2, and Success Criterion SC-002.

## User Story 3 — Clear filters

1. Log in, create at least one subject and one task (or reuse existing ones), and go to `/tasks`.
2. **Expected**: a "Clear filters" action is visible next to the Status/Subject/Sort controls even before touching any filter (per the resolved clarification: always visible, not conditional).
3. Set the Status filter to a value that leaves zero matching tasks.
4. **Expected**: the "Clear filters" action is still visible and easy to find from that empty-result state.
5. Click "Clear filters".
6. **Expected**: Status, Subject, and Sort all return to their defaults in one action, and the full, unfiltered task list reloads.
7. Click "Clear filters" again with no filters active. **Expected**: no error, list stays in its default state (no-op).

Matches spec Acceptance Scenarios 1-3 under User Story 3, Edge Cases 2-3, and Success Criterion SC-003.

## Regression check (Success Criterion SC-004)

Run the existing suites unmodified apart from the additions noted in [research.md](./research.md#testing-approach):

```bash
npm run test        # Vitest — should be unaffected, no server-side logic changed
npm run test:e2e    # Playwright — navigation.spec.ts and tasks-filter-sort.spec.ts extended, rest unchanged
```

All previously-passing tests must remain passing; only `navigation.spec.ts` and `tasks-filter-sort.spec.ts` should show new assertions.
