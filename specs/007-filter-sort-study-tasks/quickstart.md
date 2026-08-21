# Quickstart: Filter and Sort Study Tasks Validation

## Purpose

Validate that US07 lets an authenticated student filter and/or sort their own `GET /api/tasks` listing using only the allow-listed criteria, rejects unsupported/malformed values without partial execution, and leaves HU06's no-params default behavior unchanged.

## Prerequisites

- Repository cloned locally; Node.js 22+; `npm ci` run.
- `.env` created from `.env.example` with a Supabase project's URL, anon key, and service role key.
- All prior migrations applied (no new migration in this feature).
- At least two subjects and several study tasks — spanning both `pending`/`completed` status and distinct due dates — already created for the authenticated student, per HU05/HU06.

## Validation Scenarios

### 1. Filter by a supported attribute (US1)

1. Run `tests/tasks/list-tasks.spec.ts` filter cases: `?status=pending`, `?status=completed`, `?subjectId=<owned-subject>`.
2. Confirm each response contains only the requesting student's tasks matching that filter.
3. Confirm `?subjectId=<subject-owned-by-a-different-student>` returns an empty `tasks` array, never that other student's data or an error.
4. Confirm a filter matching none of the student's tasks returns a valid empty array, not an error.

### 2. Sort by a supported criterion (US2)

1. Run the sort cases in the same file: `?sortBy=dueDate&sortDir=asc`, `?sortBy=dueDate&sortDir=desc`, `?sortBy=createdAt`, `?sortBy=title`.
2. Confirm ascending/descending order is exactly as requested, and that two tasks tied on the active criterion appear in a stable, repeatable order (the `id` tiebreaker).
3. Confirm a request with no `sortBy`/`sortDir` at all reproduces HU06's existing default order (most recently created first) unchanged.

### 3. Reject unsupported/malformed values (US3)

1. Run the rejection cases: unsupported `status` value, case-variant `status` (e.g. `Pending`), unsupported `sortBy`, unsupported `sortDir`, malformed `subjectId`, `sortDir` supplied without `sortBy`, and a repeated `status` query parameter.
2. Confirm every case returns `422 VALIDATION_ERROR`, no `tasks` array in the response body, and no data changed.
3. Confirm an unauthenticated request with filter/sort parameters is rejected `401 UNAUTHENTICATED` before validation runs.

### 4. Combine a filter and a sort criterion (US4)

1. Run the combination case: `?status=pending&sortBy=dueDate&sortDir=asc`.
2. Confirm every returned task has `status: "pending"` and the set is ordered by `dueDate` ascending.
3. Run the mixed valid/invalid case: `?status=pending&sortBy=not-a-real-field`.
4. Confirm the entire request is rejected `422 VALIDATION_ERROR` — the valid `status` filter is not partially applied.

## Standard Validation Commands

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

## Filter/Sort Feature Files

- `server/api/tasks/index.get.ts`
- `server/utils/tasks/schemas.ts`
- `server/utils/tasks/repository.ts`
- `tests/tasks/schema.spec.ts`
- `tests/tasks/list-tasks.spec.ts`
