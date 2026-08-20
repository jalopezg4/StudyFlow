# Study Task List/Edit/Delete Contract

## Purpose

Define the request/response contract for HU06 (list, view, edit, delete a student's own study tasks), built on top of the TECH-03 security baseline contract and the HU05 study-task-creation contract (`specs/005-create-study-task/contracts/study-task-creation-contract.md`).

## Endpoint 1: `GET /api/tasks`

### Authentication

- Required. Resolved server-side via `requireAuthenticatedPrincipal(event)`.
- Missing/invalid session → `401 UNAUTHENTICATED`, no data read (FR-009).

### Request

No body. No query parameters required (filtering/sorting is HU07's scope).

### Success Response

`200 OK`

```jsonc
{
  "status": "ok",
  "tasks": [
    {
      "id": "uuid",
      "subjectId": "uuid",
      "title": "Read chapter 3",
      "description": "Optional note",
      "dueDate": "2026-09-01",
      "status": "pending",
      "createdAt": "2026-08-19T00:00:00.000Z"
    }
  ]
}
```

- `tasks` contains exclusively rows owned by the authenticated principal (FR-001, FR-003). An empty array is a valid, successful response.

### Error Responses

| Status | Code               | Trigger                                         |
|--------|--------------------|--------------------------------------------------|
| 401    | `UNAUTHENTICATED`  | No valid authenticated session.                  |
| 500    | `INTERNAL_ERROR`   | Unexpected failure; no internal details leaked.  |

## Endpoint 2: `GET /api/tasks/:id`

### Authentication

Same as above.

### Path Parameter

- `id` — validated with `TaskIdParamSchema` (shared with `PATCH`/`DELETE` below). Malformed ids are treated as "not found."

### Success Response

`200 OK`

```jsonc
{
  "status": "ok",
  "task": {
    "id": "uuid",
    "subjectId": "uuid",
    "title": "Read chapter 3",
    "description": "Optional note",
    "dueDate": "2026-09-01",
    "status": "pending",
    "createdAt": "2026-08-19T00:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code               | Trigger                                                                 |
|--------|--------------------|--------------------------------------------------------------------------|
| 401    | `UNAUTHENTICATED`  | No valid authenticated session.                                         |
| 404    | `NOT_FOUND`        | The `id` does not exist, or belongs to a different student — indistinguishable to the caller. |
| 500    | `INTERNAL_ERROR`   | Unexpected failure; no internal details leaked.                        |

## Endpoint 3: `PATCH /api/tasks/:id`

### Authentication

Same as above.

### Path Parameter

Same as Endpoint 2.

### Request Body

Validated with `UpdateStudyTaskSchema` (Zod), source `'body'`:

```jsonc
{
  "title": "Read chapters 3-4",  // optional, trimmed, 1-100 chars when present
  "description": "Updated note", // optional, ≤ 500 chars when present
  "dueDate": "2026-09-05",       // optional, YYYY-MM-DD when present
  "status": "completed"          // optional, "pending" | "completed" when present
}
```

- At least one of the four fields MUST be present; a body with none of them → `422 VALIDATION_ERROR`.
- No `userId`/`ownerId`/`subjectId` field is accepted; a task's owning subject cannot be reassigned via this endpoint (out of scope — not requested by the spec).

### Success Response

`200 OK`

```jsonc
{
  "status": "updated",
  "task": {
    "id": "uuid",
    "subjectId": "uuid",
    "title": "Read chapters 3-4",
    "description": "Updated note",
    "dueDate": "2026-09-05",
    "status": "completed",
    "createdAt": "2026-08-19T00:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code               | Trigger                                                                 |
|--------|--------------------|--------------------------------------------------------------------------|
| 401    | `UNAUTHENTICATED`  | No valid authenticated session.                                         |
| 422    | `VALIDATION_ERROR` | Empty body, invalid title/description/dueDate/status.                   |
| 404    | `NOT_FOUND`        | The `id` does not exist, or belongs to a different student.             |
| 500    | `INTERNAL_ERROR`   | Unexpected failure; no internal details leaked.                        |

## Endpoint 4: `DELETE /api/tasks/:id`

### Authentication

Same as above.

### Path Parameter

Same as Endpoint 2.

### Success Response

`200 OK`

```jsonc
{
  "status": "deleted",
  "id": "uuid"
}
```

- After this response, the task no longer appears in the owner's `GET /api/tasks` listing (FR-012).

### Error Responses

| Status | Code               | Trigger                                                                 |
|--------|--------------------|--------------------------------------------------------------------------|
| 401    | `UNAUTHENTICATED`  | No valid authenticated session.                                         |
| 404    | `NOT_FOUND`        | The `id` does not exist, or belongs to a different student.             |
| 500    | `INTERNAL_ERROR`   | Unexpected failure; no internal details leaked.                        |

No `409 CONFLICT` case exists for this endpoint (see spec Clarifications — no dependency rule blocks task deletion today).

## Ownership Contract

- For all four endpoints, the acting student is derived exclusively from `requireAuthenticatedPrincipal(event).userId`. No endpoint accepts or honors a client-supplied owner/user identifier (FR-010).
- `GET /:id`/`PATCH`/`DELETE` all use a single query scoped by both the path `id` and the principal's `userId` — no separate "fetch, then compare owner" step, so a not-owned task and a nonexistent task always produce the identical `404 NOT_FOUND` (FR-008).
- All four endpoints run against the request-scoped Supabase client (`requireRequestSupabaseClient`), so RLS is a real, enforced backstop behind the application-layer check, not a dormant policy.

## Handler Composition

Mirrors the existing protected-route pattern (`server/api/subjects/*.ts`, `server/api/tasks/index.post.ts`):

1. `requireAuthenticatedPrincipal(event)` — auth boundary.
2. `requireRequestSupabaseClient(event)` — RLS-enforced client boundary.
3. `validateWithSchema(...)` — path-param and/or body validation boundary, as applicable per endpoint.
4. Repository call (`listStudyTasksForOwner` / `getStudyTaskForOwner` / `updateStudyTask` / `deleteStudyTask`) — persistence, always scoped by `principal.userId`.
5. On thrown errors, `sendSafeError(event, error)` — safe error boundary.

## Traceability

- Spec source: `specs/006-manage-study-tasks/spec.md`
- Plan source: `specs/006-manage-study-tasks/plan.md`
- Data model: `specs/006-manage-study-tasks/data-model.md`
- HU05 contract (extended, not duplicated): `specs/005-create-study-task/contracts/study-task-creation-contract.md`
- Security baseline contract (reused): `specs/003-security-quality-baseline/contracts/security-baseline-contract.md`
- Routes: `server/api/tasks/index.get.ts`, `server/api/tasks/[id].get.ts`, `server/api/tasks/[id].patch.ts`, `server/api/tasks/[id].delete.ts`
- Schemas: `server/utils/tasks/schemas.ts`
- Repository: `server/utils/tasks/repository.ts`
- Migration: `supabase/migrations/20260820000000_study_tasks_update_delete_policies.sql`
- Tests: `tests/tasks/list-tasks.spec.ts`, `tests/tasks/get-task.spec.ts`, `tests/tasks/update-task.spec.ts`, `tests/tasks/delete-task.spec.ts`, extended `tests/tasks/ownership.spec.ts`
