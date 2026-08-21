# Quickstart: My Subjects and My Tasks Navigation & UX Polish Validation

## Purpose

Validate that an authenticated student can discover and reach their existing subjects/tasks from a persistent, consistently-styled navigation on every authenticated page, without losing any existing subject/task functionality.

## Prerequisites

- Repository cloned locally; Node.js 22+; `npm ci` run.
- `.env` created from `.env.example` with a Supabase project's URL, anon key, and service role key; migrations applied; email confirmation disabled (per `README.md`'s Authentication section).

## Validation Scenarios

### 1. Find and reach My Subjects / My Tasks from anywhere authenticated (US1)

1. Run `tests/e2e/navigation.spec.ts`'s presence/navigation cases.
2. Confirm the nav (Dashboard / My Subjects / My Tasks / Log out) is visible on `/dashboard`, `/subjects`, and `/tasks`.
3. Confirm clicking "My Subjects" from any of those three pages lands on `/subjects` and shows the student's own subjects (no creation step in between).
4. Confirm clicking "My Tasks" similarly lands on `/tasks` with the student's own tasks.
5. Confirm the currently active entry is visually distinguishable from the other two on each of the three pages.

### 2. Consistent look and log out from anywhere (US2, Decision 3)

1. Confirm the same nav markup/styling renders identically across `/dashboard`, `/subjects`, and `/tasks`.
2. From `/subjects` (not the dashboard), click "Log out" and confirm the session ends and the student is redirected to `/login` — this specifically covers the previously-missing "log out from a non-dashboard page" case.

### 3. Nothing existing regresses (US3)

1. Run the full existing automated suite: `tests/tasks/`, `tests/subjects/`, `tests/security/`, `tests/unit/`, and the existing `tests/e2e/` specs (`auth.spec.ts`, `tasks-filter-sort.spec.ts`, `tasks-recommendation.spec.ts`, `tasks-due-date-rules.spec.ts`).
2. Confirm 100% still pass unchanged — this is the regression gate for User Story 3; no test in this list should need modification because of this feature.

## Standard Validation Commands

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run test:e2e`
6. `npm run build`

## Navigation Feature Files

- `app/app.vue` (wraps `<NuxtPage />` in `<NuxtLayout>`, required for the layout system to activate)
- `app/components/AppNav.vue`
- `app/layouts/authenticated.vue`
- `app/pages/dashboard.vue`
- `app/pages/subjects/index.vue`
- `app/pages/tasks/index.vue`
- `tests/e2e/navigation.spec.ts`
