# Study Task Filter/Sort Contract

## Purpose

Define the query-parameter contract US07 (filter and sort a student's own study task listing) adds to the existing `GET /api/tasks` endpoint from `specs/006-manage-study-tasks/contracts/study-task-crud-contract.md`. This amends that endpoint's "Request" section only — authentication, response envelope shape, and error envelope are unchanged and reused as-is.

## Endpoint: `GET /api/tasks`

### Authentication

Unchanged from HU06: required, resolved via `requireAuthenticatedPrincipal(event)`. Missing/invalid session → `401 UNAUTHENTICATED`, rejected before any query-parameter parsing or data access (FR-010).

### Request

All query parameters are optional. Supplying none reproduces HU06's existing default listing exactly (FR-011).

| Parameter | Type | Allow-listed values |
|---|---|---|
| `status` | string | `pending`, `completed` |
| `subjectId` | string (uuid) | any well-formed UUID |
| `sortBy` | string | `dueDate`, `createdAt`, `title` |
| `sortDir` | string | `asc`, `desc` |

Example requests:

```text
GET /api/tasks
GET /api/tasks?status=pending
GET /api/tasks?subjectId=6e2c...&status=pending
GET /api/tasks?sortBy=dueDate&sortDir=asc
GET /api/tasks?sortBy=dueDate            # sortDir defaults to asc
GET /api/tasks?status=pending&sortBy=dueDate&sortDir=asc
```

### Success Response

`200 OK` — same envelope shape as HU06:

```jsonc
{
  "status": "ok",
  "tasks": [
    {
      "id": "uuid",
      "subjectId": "uuid",
      "subjectName": "Calculus II",
      "title": "Read chapter 3",
      "description": "Optional note",
      "dueDate": "2026-09-01",
      "status": "pending",
      "createdAt": "2026-08-19T00:00:00.000Z"
    }
  ]
}
```

- `tasks` contains exclusively rows owned by the authenticated principal that satisfy every supplied filter (AND semantics — FR-006, FR-009), ordered per the requested (or default) sort criterion with the `id` tiebreaker applied (FR-012).
- An empty array is a valid, successful response — both when no tasks match and when the student has zero tasks at all (FR-011's "empty result, not an error" cases, including a `subjectId` the student doesn't own).

### Error Responses

| Status | Code | Trigger |
|---|---|---|
| 401 | `UNAUTHENTICATED` | No valid authenticated session. Checked before query parsing. |
| 422 | `VALIDATION_ERROR` | Any query parameter fails the allow-list: unsupported `status`/`sortBy`/`sortDir` value, malformed `subjectId`, `sortDir` supplied without `sortBy`, or a repeated/array-valued parameter. Raised by the existing shared `validateWithSchema(TaskListQuerySchema, getQuery(event), 'query')` helper (`server/utils/security/validation.ts`), matching the status code every other validated input in this codebase already uses. Rejection is total — no partial filtering/sorting is applied and `tasks` is never present in the response body. |
| 500 | `INTERNAL_ERROR` | Unexpected failure; no internal details leaked. |

### NULL due-date ordering

`dueDate` sort does not override PostgreSQL's default NULL placement: `NULL` sorts last on `sortDir=asc` and first on `sortDir=desc`. This is not separately configured — it is PostgreSQL's standard behavior, left as-is. Combined with the `id` tiebreaker below, this is still fully deterministic for tasks with no due date.

### Behavioral guarantees carried over from HU06

- Ownership is enforced identically to the unfiltered listing (`user_id`-scoped query); no filter value can widen the result set beyond the requesting student's own tasks (FR-009).
- Filtering and sorting never modify stored data — this remains a read-only `GET`.
