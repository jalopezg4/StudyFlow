# Subject Creation Contract

## Purpose

Define the request/response contract for HU03 (create a subject), built on top of the TECH-03 security baseline contract (`specs/003-security-quality-baseline/contracts/security-baseline-contract.md`).

## Endpoint

`POST /api/subjects`

### Authentication

- Required. Resolved server-side via `requireAuthenticatedPrincipal(event)`.
- Missing/invalid session → `401 UNAUTHENTICATED`, no data persisted (CA03).

### Request Body

Validated with `CreateSubjectSchema` (Zod), source `'body'`:

```jsonc
{
  "name": "Calculus I",        // required, trimmed, 1-100 chars
  "description": "Optional note" // optional, ≤ 500 chars
}
```

- No `user_id`/`ownerId`/owner field is accepted in the body. Any such field, if present, is not part of the schema and is dropped during parsing — it can never influence the stored owner (FR-007).
- Empty string, whitespace-only, or omitted `name` → `422 VALIDATION_ERROR` (CA02).
- `name` longer than 100 characters (after trim) → `422 VALIDATION_ERROR`.
- `description` longer than 500 characters → `422 VALIDATION_ERROR`.

### Success Response

`201 Created`

```jsonc
{
  "status": "created",
  "subject": {
    "id": "uuid",
    "name": "Calculus I",
    "description": "Optional note",
    "createdAt": "2026-08-18T00:00:00.000Z"
  }
}
```

- The `user_id`/owner is never included as caller-controlled input in the response; it is implicit (the caller's own id).

### Error Responses

Reuses the safe error envelope from `server/utils/security/errors.ts` (`SafeErrorPayload`):

| Status | Code               | Trigger                                                        |
|--------|--------------------|-----------------------------------------------------------------|
| 401    | `UNAUTHENTICATED`  | No valid authenticated session (CA03).                          |
| 422    | `VALIDATION_ERROR` | Empty/whitespace/over-length `name`, or over-length `description` (CA02). |
| 500    | `INTERNAL_ERROR`   | Unexpected failure (e.g., database error); no internal details leaked. |

## Ownership Contract

- `user_id` for the inserted row MUST equal `requireAuthenticatedPrincipal(event).userId`. This is enforced twice: at the application layer (the insert call only ever receives the principal's id) and at the database layer (RLS `subjects_insert_own` policy, `WITH CHECK (auth.uid() = user_id)`).
- A student can never cause a subject to be created under another student's ownership, regardless of request payload content (FR-006, FR-007, FR-010).

## Handler Composition

Mirrors the existing protected-route pattern in `server/api/security/_template-protected-handler.ts`:

1. `requireAuthenticatedPrincipal(event)` — auth boundary.
2. `validateWithSchema(CreateSubjectSchema, await readBody(event), 'body')` — validation boundary.
3. `createSubject({ userId: principal.userId, ...validatedBody })` — persistence, owner derived from step 1 only.
4. On thrown errors, `sendSafeError(event, error)` — safe error boundary (reused as-is, no new error-handling logic).

## Traceability

- Spec source: `specs/004-subject-management/spec.md`
- Plan source: `specs/004-subject-management/plan.md`
- Data model: `specs/004-subject-management/data-model.md`
- Security baseline contract (reused, not duplicated): `specs/003-security-quality-baseline/contracts/security-baseline-contract.md`
- Route: `server/api/subjects/index.post.ts`
- Schema: `server/utils/subjects/schemas.ts`
- Repository: `server/utils/subjects/repository.ts`
- Migration: `supabase/migrations/20260818000000_create_subjects_table.sql`
- Tests: `tests/subjects/`
