# Quickstart: Study Task Creation Validation

## Purpose

Validate that HU05 allows an authenticated student to create a study task under a subject they own, rejects invalid input, rejects creation under a subject the student does not own, and rejects unauthenticated requests.

## Prerequisites

- Repository cloned locally; Node.js 22+; `npm ci` run.
- `.env` created from `.env.example` with a Supabase project's URL, anon key, and service role key.
- The `subjects` migration (`20260818000000_create_subjects_table.sql`) and the `study_tasks` migration (`20260819000000_create_study_tasks_table.sql`) applied to the target Supabase database.
- At least one subject already created for the authenticated student (task creation depends on an existing owned subject).

## Validation Scenarios

### 1. Create a task under an owned subject (US1)

1. Run the automated test suite (`tests/tasks/create-task.spec.ts`) covering: title only, title + description + due date, title only with optional fields omitted.
2. Confirm the created row is persisted with the correct `user_id`, `subject_id`, `title`, `description`, `due_date`, and `status: 'pending'` by querying it back through the repository function.

**Expected outcome**: The task is stored, associated with the authenticated student and the correct subject, and immediately retrievable.

### 2. Reject creation under another student's subject (US2)

1. Run `tests/tasks/ownership.spec.ts` cases where Student B attempts to create a task under a subject id owned by Student A, and where the subject id does not exist at all.
2. Confirm both cases return `404 NOT_FOUND` with no task created, and that the two cases are indistinguishable in the response.

**Expected outcome**: Cross-ownership and nonexistent-subject attempts are denied identically, with zero persisted rows.

### 3. Reject invalid task data (US3)

1. Run `tests/tasks/schema.spec.ts` and `tests/tasks/create-task.spec.ts` cases for: missing/empty/whitespace-only `title`, `title` over 100 characters, `description` over 500 characters, and an invalid `dueDate`.
2. Confirm each case returns a `422 VALIDATION_ERROR` and that no row is written.

**Expected outcome**: All invalid-input cases are rejected before persistence, with a validation error identifying the failing field.

### 4. Reject unauthenticated requests

1. Run `tests/tasks/ownership.spec.ts` for a request built without an authenticated principal.
2. Confirm the response is `401 UNAUTHENTICATED` and no row is written.

**Expected outcome**: Unauthenticated attempts are rejected server-side, matching the existing `tests/security/authz-baseline.spec.ts` behavior.

### 5. Ownership cannot be spoofed

1. Run the `ownership.spec.ts` case that sends a request body containing an extraneous owner-like field or a `status` field alongside valid data, using an authenticated fixture.
2. Confirm the persisted row's `user_id` always matches the authenticated principal and `status` is always `'pending'`, never the payload's values.

**Expected outcome**: The stored owner and initial status are always derived server-side, never from client input.

## Standard Validation Commands

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

**Expected outcome**: All commands pass after HU05 implementation.

## Study Task Feature Files

- `server/api/tasks/index.post.ts`
- `server/utils/tasks/schemas.ts`
- `server/utils/tasks/repository.ts`
- `app/components/tasks/TaskForm.vue`
- `app/pages/tasks/index.vue`
- `tests/tasks/schema.spec.ts`
- `tests/tasks/create-task.spec.ts`
- `tests/tasks/ownership.spec.ts`
