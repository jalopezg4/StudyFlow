# Subject List/Edit/Delete Contract

## Purpose

Define the request/response contract for HU04 (list, view, edit, delete a student's own subjects), built on top of the TECH-03 security baseline contract and the HU03 subject-creation contract (`specs/004-subject-management/contracts/subject-management-contract.md`).

## Endpoint 1: `GET /api/subjects`

### Authentication

- Required. Resolved server-side via `requireAuthenticatedPrincipal(event)`.
- Missing/invalid session → `401 UNAUTHENTICATED`, no data read (FR-008).

### Request

No body. No query parameters required.

### Success Response

`200 OK`

```jsonc
{
  "status": "ok",
  "subjects": [
    {
      "id": "uuid",
      "name": "Calculus I",
      "description": "Optional note",
      "createdAt": "2026-08-18T00:00:00.000Z"
    }
  ]
}
```

- `subjects` contains exclusively rows owned by the authenticated principal (FR-001, FR-002). An empty array is a valid, successful response (no subjects yet).

### Error Responses

| Status | Code             | Trigger                                    |
|--------|------------------|---------------------------------------------|
| 401    | `UNAUTHENTICATED`| No valid authenticated session.             |
| 500    | `INTERNAL_ERROR` | Unexpected failure; no internal details leaked. |

## Endpoint 2: `GET /api/subjects/:id`

### Authentication

- Required. Resolved server-side via `requireAuthenticatedPrincipal(event)`.
- Missing/invalid session → `401 UNAUTHENTICATED`, no data read.

### Path Parameter

- `id` — validated with `SubjectIdParamSchema` (shared with `PATCH`/`DELETE` below). Malformed ids are treated as "not found" (see Error Responses), not as a distinct validation-error class, to avoid distinguishing "malformed id" from "well-formed id belonging to someone else."

### Request Body

None.

### Success Response

`200 OK`

```jsonc
{
  "status": "ok",
  "subject": {
    "id": "uuid",
    "name": "Calculus I",
    "description": "Optional note",
    "createdAt": "2026-08-18T00:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code               | Trigger                                                                 |
|--------|--------------------|--------------------------------------------------------------------------|
| 401    | `UNAUTHENTICATED`  | No valid authenticated session.                                         |
| 404    | `NOT_FOUND`        | The `id` does not exist, or exists but is owned by a different student (CA03 AC3 — "attempts to view it directly") — both cases are indistinguishable to the caller. |
| 500    | `INTERNAL_ERROR`   | Unexpected failure; no internal details leaked.                        |

This endpoint exists specifically to give User Story 3's third acceptance scenario ("Student B attempts to view [Student A's subject] directly... by guessing or supplying its identifier") something concrete to deny — see `research.md` Decision 8.

## Endpoint 3: `PATCH /api/subjects/:id`

### Authentication

- Required, same as above. Missing/invalid session → `401 UNAUTHENTICATED`, no data changed.

### Path Parameter

- `id` — validated with `SubjectIdParamSchema` (same schema as the `GET /api/subjects/:id` endpoint above). Malformed ids are treated as "not found" (see Error Responses), not as a distinct validation-error class, to avoid distinguishing "malformed id" from "well-formed id belonging to someone else."

### Request Body

Validated with `UpdateSubjectSchema` (Zod), source `'body'`:

```jsonc
{
  "name": "Calculus I - retake",     // optional, trimmed, 1-100 chars when present
  "description": "Updated note"       // optional, ≤ 500 chars when present
}
```

- At least one of `name`/`description` MUST be present; a body with neither → `422 VALIDATION_ERROR`.
- No `user_id`/`ownerId` field is accepted; the schema has no such field, so it cannot influence which row is targeted or its owner (FR-009).
- Empty/whitespace-only `name` (when provided), over-length `name`, or over-length `description` → `422 VALIDATION_ERROR` (CA02, reusing HU03's limits).

### Success Response

`200 OK`

```jsonc
{
  "status": "updated",
  "subject": {
    "id": "uuid",
    "name": "Calculus I - retake",
    "description": "Updated note",
    "createdAt": "2026-08-18T00:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code               | Trigger                                                                 |
|--------|--------------------|--------------------------------------------------------------------------|
| 401    | `UNAUTHENTICATED`  | No valid authenticated session.                                         |
| 422    | `VALIDATION_ERROR` | Empty body, empty/whitespace/over-length `name`, or over-length `description`. |
| 404    | `NOT_FOUND`        | The `id` does not exist, or exists but is owned by a different student (CA03) — both cases are indistinguishable to the caller. |
| 500    | `INTERNAL_ERROR`   | Unexpected failure; no internal details leaked.                        |

## Endpoint 4: `DELETE /api/subjects/:id`

### Authentication

- Required, same as above. Missing/invalid session → `401 UNAUTHENTICATED`, no data changed.

### Path Parameter

- `id` — same validation and not-found-on-mismatch behavior as `PATCH`.

### Request Body

None.

### Success Response

`200 OK`

```jsonc
{
  "status": "deleted",
  "id": "uuid"
}
```

- After this response, the subject no longer appears in the owner's `GET /api/subjects` listing (FR-012, CA04).

### Error Responses

| Status | Code               | Trigger                                                                 |
|--------|--------------------|--------------------------------------------------------------------------|
| 401    | `UNAUTHENTICATED`  | No valid authenticated session.                                         |
| 404    | `NOT_FOUND`        | The `id` does not exist, or exists but is owned by a different student (CA03) — indistinguishable to the caller. |
| 409    | `CONFLICT`         | The subject has one or more associated study tasks; deletion is blocked and nothing is deleted (FR-010, FR-011, CA04's blocked-deletion case). |
| 500    | `INTERNAL_ERROR`   | Unexpected failure; no internal details leaked.                        |

## Ownership Contract

- For all four endpoints, the acting student is derived exclusively from `requireAuthenticatedPrincipal(event).userId`. No endpoint accepts or honors a client-supplied owner/user identifier (FR-009).
- `GET /:id`/`PATCH`/`DELETE` all use a single query scoped by both the path `id` and the principal's `userId`; there is no separate "fetch, then compare owner" step, so a not-owned subject and a nonexistent subject always produce the identical `404 NOT_FOUND` (FR-007; see `research.md` Decision 2/8).

## Handler Composition

Mirrors the existing protected-route pattern (`server/api/security/_template-protected-handler.ts`, and HU03's `server/api/subjects/index.post.ts`):

1. `requireAuthenticatedPrincipal(event)` — auth boundary.
2. `validateWithSchema(...)` — path-param and/or body validation boundary, as applicable per endpoint.
3. Repository call (`listSubjectsForOwner` / `getSubjectForOwner` / `updateSubject` / `deleteSubject`) — persistence, always scoped by `principal.userId`.
4. On thrown errors, `sendSafeError(event, error)` — safe error boundary, extended to recognize `NOT_FOUND`/`CONFLICT` (see `research.md` Decision 3).

## Traceability

- Spec source: `specs/005-manage-subjects/spec.md`
- Plan source: `specs/005-manage-subjects/plan.md`
- Data model: `specs/005-manage-subjects/data-model.md`
- HU03 contract (extended, not duplicated): `specs/004-subject-management/contracts/subject-management-contract.md`
- Security baseline contract (reused): `specs/003-security-quality-baseline/contracts/security-baseline-contract.md`
- Routes: `server/api/subjects/index.get.ts`, `server/api/subjects/[id].get.ts`, `server/api/subjects/[id].patch.ts`, `server/api/subjects/[id].delete.ts`
- Schemas: `server/utils/subjects/schemas.ts`
- Repository: `server/utils/subjects/repository.ts`
- Migration: `supabase/migrations/20260818010000_subjects_update_delete_policies.sql`
- Tests: `tests/subjects/list-subjects.spec.ts`, `tests/subjects/get-subject.spec.ts`, `tests/subjects/update-subject.spec.ts`, `tests/subjects/delete-subject.spec.ts`, extended `tests/subjects/ownership.spec.ts`
