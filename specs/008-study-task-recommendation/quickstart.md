# Quickstart: Study Task Recommendation Validation

## Purpose

Validate that US08 recommends the correct single highest-priority study task per the documented Prioritization Rule, excludes completed tasks, returns a valid empty state when nothing is eligible, and never crosses student ownership boundaries.

## Prerequisites

- Repository cloned locally; Node.js 22+; `npm ci` run.
- `.env` created from `.env.example` with a Supabase project's URL, anon key, and service role key.
- All prior migrations applied (no new migration in this feature).
- At least one subject and several study tasks — spanning `pending`/`completed` status, distinct due dates, and at least one task with no due date — already created for the authenticated student, per HU05/HU06.

## Validation Scenarios

### 1. Recommend the highest-priority eligible task (US1)

1. Run `tests/tasks/recommendation-repository.spec.ts` ranking cases: soonest due date wins over a later one; a task with no due date only wins when no dated eligible task exists; a tie on due date (or on no-due-date-at-all) resolves by oldest `createdAt`, then by `id`.
2. Run `tests/tasks/recommendation.spec.ts` route-level case for `GET /api/tasks/recommendation` and confirm the response is `200 OK` with exactly one `task`.
3. Confirm repeating the same request against unchanged data returns the identical task every time (determinism — FR-003).

### 2. Exclude completed tasks (US1 AC02)

1. Run the repository case covering a student whose only "best by due date" task is `completed`: confirm it is skipped and the next eligible `pending` task is returned instead.
2. Confirm a student whose tasks are *all* `completed` receives the same empty-state result as having no tasks at all (see Scenario 3).

### 3. Empty-state response (US2)

1. Run the case for a student with zero study tasks: confirm `200 OK` with `{ "task": null }`, not an error.
2. Run the case for a student whose only tasks are all `completed`: confirm the identical `{ "task": null }` result.

### 4. Ownership isolation (US3)

1. Run the cross-student repository/route case: with tasks seeded for two students, confirm each student's recommendation only ever returns their own task, never the other's, even when the other student's task would rank higher under the Prioritization Rule in isolation.
2. Confirm an unauthenticated request to `GET /api/tasks/recommendation` is rejected `401 UNAUTHENTICATED` before any task is evaluated.

## Standard Validation Commands

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

## Recommendation Feature Files

- `server/api/tasks/recommendation.get.ts`
- `server/utils/tasks/repository.ts`
- `tests/tasks/recommendation-repository.spec.ts`
- `tests/tasks/recommendation.spec.ts`
