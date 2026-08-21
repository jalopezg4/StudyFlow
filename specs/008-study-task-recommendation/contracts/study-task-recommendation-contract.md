# Study Task Recommendation Contract

## Purpose

Define the request/response contract for US08 (recommend the single highest-priority study task), built on the TECH-03 security baseline and the HU05/HU06/HU07 Study Task model.

## Endpoint: `GET /api/tasks/recommendation`

### Authentication

- Required. Resolved server-side via `requireAuthenticatedPrincipal(event)`.
- Missing/invalid session → `401 UNAUTHENTICATED`, no task evaluated (FR-006).

### Request

No path parameters, no query parameters, no body.

```text
GET /api/tasks/recommendation
```

### Success Response

`200 OK` in both cases below — the empty-state case is not an error (FR-004).

**A recommendation exists:**

```jsonc
{
  "status": "ok",
  "task": {
    "id": "uuid",
    "subjectId": "uuid",
    "subjectName": "Calculus II",
    "title": "Read chapter 3",
    "description": "Optional note",
    "dueDate": "2026-09-01",
    "status": "pending",
    "createdAt": "2026-08-19T00:00:00.000Z"
  }
}
```

- `task` is the single highest-ranked eligible task per the Prioritization Rule in `specs/008-study-task-recommendation/spec.md` (equivalently, `data-model.md`'s Ranking definition). It is always `status: "pending"` — a completed task can never appear here (FR-002).

**No eligible task (empty state):**

```jsonc
{
  "status": "ok",
  "task": null
}
```

- Returned identically whether the student has zero tasks at all or every task they have is completed (User Story 2, Acceptance Scenarios 1–2).

### Error Responses

| Status | Code | Trigger |
|---|---|---|
| 401 | `UNAUTHENTICATED` | No valid authenticated session. Checked before any task is evaluated. |
| 500 | `INTERNAL_ERROR` | Unexpected failure; no internal details leaked. |

### Behavioral guarantees

- Ownership is enforced identically to every other task endpoint (`user_id`-scoped query); no recommendation can ever surface a task belonging to another student (FR-005, User Story 3).
- This is a read-only `GET`; generating a recommendation never modifies stored data (FR-007).
- Repeating this request with unchanged underlying task data always returns the same `task` (or the same empty state) — see data-model.md's Determinism note (FR-003, SC-002).
