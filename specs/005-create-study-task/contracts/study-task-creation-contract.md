# Study Task Creation Contract

## Purpose

Define the request/response contract for HU05 (create a study task), built on top of the TECH-03 security baseline contract (`specs/003-security-quality-baseline/contracts/security-baseline-contract.md`) and the existing subjects feature (HU03/HU04).

## Endpoint

`POST /api/tasks`

### Authentication

- Required. Resolved server-side via `requireAuthenticatedPrincipal(event)`.
- Missing/invalid session → `401 UNAUTHENTICATED`, no data persisted.

### Request Body

Validated with `CreateStudyTaskSchema` (Zod), source `'body'`:

```jsonc
{
  "subjectId": "uuid",           // required
  "title": "Read chapter 3",     // required, trimmed, 1-100 chars
  "description": "Optional note",// optional, ≤ 500 chars
  "dueDate": "2026-09-01"        // optional, valid date string
}
```

- No `userId`/`ownerId`/owner field or `status` field is accepted in the body. Neither is part of the schema, so either is dropped during parsing — the owner can never be spoofed and the status can never be set to anything other than `pending` on creation.
- Empty string, whitespace-only, or omitted `title` → `422 VALIDATION_ERROR`.
- `title` longer than 100 characters (after trim) → `422 VALIDATION_ERROR`.
- `description` longer than 500 characters → `422 VALIDATION_ERROR`.
- `dueDate` present but not a valid date → `422 VALIDATION_ERROR`.
- `dueDate` submitted as an empty string is treated as "no due date", not a validation failure.
- Missing or malformed `subjectId` → `422 VALIDATION_ERROR`.

### Success Response

`201 Created`

```jsonc
{
  "status": "created",
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

- The owner is never included as caller-controlled input in the response; it is implicit (the caller's own id).

### Error Responses

Reuses the safe error envelope from `server/utils/security/errors.ts` (`SafeErrorPayload`):

| Status | Code               | Trigger                                                                 |
|--------|--------------------|--------------------------------------------------------------------------|
| 401    | `UNAUTHENTICATED`  | No valid authenticated session.                                          |
| 404    | `NOT_FOUND`        | `subjectId` does not reference a subject owned by the requesting student (existence is never disclosed either way). |
| 422    | `VALIDATION_ERROR` | Empty/whitespace/over-length `title`, over-length `description`, invalid `dueDate`, or missing/malformed `subjectId`. |
| 500    | `INTERNAL_ERROR`   | Unexpected failure (e.g., database error); no internal details leaked.   |

## Ownership Contract

- `user_id` for the inserted row MUST equal `requireAuthenticatedPrincipal(event).userId`. Enforced at the application layer (the insert call only ever receives the principal's id) and at the database layer (RLS `study_tasks_insert_own` policy).
- `subject_id` MUST reference a subject already owned by that same principal. Enforced at the application layer (an explicit `getSubjectForOwner` lookup before insert, returning `404 NOT_FOUND` when it fails) and at the database layer (the same RLS policy's `EXISTS` subquery).
- A student can never cause a task to be created under another student's subject, or attributed to another student, regardless of request payload content (FR-007, FR-008, FR-009).

## Handler Composition

Mirrors the existing protected-route pattern used by `server/api/subjects/index.post.ts`:

1. `requireAuthenticatedPrincipal(event)` — auth boundary.
2. `validateWithSchema(CreateStudyTaskSchema, await readBody(event), 'body')` — validation boundary.
3. `getSubjectForOwner(principal.userId, body.subjectId)` — ownership boundary; throw `404 NOT_FOUND` if `null`.
4. `createStudyTask(principal.userId, body)` — persistence, owner and subject already verified by steps 1 and 3.
5. On thrown errors, `sendSafeError(event, error)` — safe error boundary (reused as-is, no new error-handling logic).

## Traceability

- Spec source: `specs/005-create-study-task/spec.md`
- Plan source: `specs/005-create-study-task/plan.md`
- Data model: `specs/005-create-study-task/data-model.md`
- Security baseline contract (reused, not duplicated): `specs/003-security-quality-baseline/contracts/security-baseline-contract.md`
- Route: `server/api/tasks/index.post.ts`
- Schema: `server/utils/tasks/schemas.ts`
- Repository: `server/utils/tasks/repository.ts`
- Migration: `supabase/migrations/20260819000000_create_study_tasks_table.sql`
- Tests: `tests/tasks/`
