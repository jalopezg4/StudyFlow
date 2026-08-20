# Quickstart: Study Task List/Edit/Delete Validation

## Purpose

Validate that HU06 allows an authenticated student to list, view, edit (including status changes), and delete their own study tasks, denies cross-ownership access, and rejects invalid updates.

## Prerequisites

- Repository cloned locally; Node.js 22+; `npm ci` run.
- `.env` created from `.env.example` with a Supabase project's URL, anon key, and service role key.
- All prior migrations applied, including `20260820000000_study_tasks_update_delete_policies.sql`.
- At least one subject and one study task already created for the authenticated student.

## Validation Scenarios

### 1. List my own tasks (US1)

1. Run `tests/tasks/list-tasks.spec.ts`.
2. Confirm the response contains exclusively the requesting student's tasks, and an empty array when they have none.

### 2. Edit a task, including status (US2)

1. Run `tests/tasks/update-task.spec.ts` for: title-only, description-only, dueDate-only, status-only updates, and combinations.
2. Confirm each persists and is reflected in the response, with untouched fields left as-is.
3. Run the same file's invalid-input cases (empty title, over-length fields, invalid dueDate, invalid status, empty body) and confirm `422 VALIDATION_ERROR` with no persisted change.

### 3. Cross-ownership denial (US3)

1. Run `tests/tasks/ownership.spec.ts` cases for Student B attempting to view/edit/delete Student A's task, and for a nonexistent task id.
2. Confirm all return `404 NOT_FOUND` with no data changed, indistinguishable from each other.

### 4. Delete a task (US4)

1. Run `tests/tasks/delete-task.spec.ts`.
2. Confirm a successful delete removes the task from a subsequent listing, and a repeat/nonexistent delete attempt returns `404 NOT_FOUND` without erroring the flow.

## Standard Validation Commands

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

## Study Task Management Feature Files

- `server/api/tasks/index.get.ts`
- `server/api/tasks/[id].get.ts`
- `server/api/tasks/[id].patch.ts`
- `server/api/tasks/[id].delete.ts`
- `server/utils/tasks/schemas.ts`
- `server/utils/tasks/repository.ts`
- `app/components/tasks/TaskList.vue`
- `app/components/tasks/TaskEditForm.vue`
- `tests/tasks/list-tasks.spec.ts`
- `tests/tasks/get-task.spec.ts`
- `tests/tasks/update-task.spec.ts`
- `tests/tasks/delete-task.spec.ts`
