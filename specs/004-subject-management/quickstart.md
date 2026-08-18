# Quickstart: Subject Creation Validation

## Purpose

Validate that HU03 allows an authenticated student to create a subject, rejects invalid input, and rejects unauthenticated requests.

## Prerequisites

- Repository cloned locally; Node.js 22+; `npm ci` run.
- `.env` created from `.env.example` with a Supabase project's URL, anon key, and service role key (non-production values for local work).
- The `subjects` migration applied to the target Supabase database (`supabase/migrations/20260818000000_create_subjects_table.sql`), via the Supabase CLI (`supabase db push`) or the Supabase SQL editor.

## Known Limitation (until HU01 ships)

There is no real login UI yet, so a manual browser walkthrough cannot produce a genuine authenticated session. Use the automated tests below to exercise the authenticated paths (CA01, CA02); they authenticate by constructing an `event.context.auth.userId` fixture, the same pattern already used in `tests/security/fixtures.ts`. Once HU01 ships a real session, this quickstart should be extended with a manual "sign in, then submit the form" walkthrough.

## Validation Scenarios

### 1. Create a subject (CA01)

1. Run the automated test suite (`tests/subjects/create-subject.spec.ts`) covering: valid name only, valid name + description.
2. Confirm the created row is persisted with the correct `user_id`, `name`, and `description` by querying it back through the repository function.

**Expected outcome**: The subject is stored and associated with the authenticated student; nothing is returned for a different student's id.

### 2. Reject an empty name (CA02)

1. Run `tests/subjects/schema.spec.ts` and `tests/subjects/create-subject.spec.ts` cases for: missing `name`, empty string, whitespace-only string, and a name over 100 characters.
2. Confirm each case returns a `422 VALIDATION_ERROR` and that no row is written.

**Expected outcome**: All invalid-name cases are rejected before persistence, with a validation error identifying the failing field.

### 3. Reject unauthenticated requests (CA03)

1. Run `tests/subjects/ownership.spec.ts` for a request built without an authenticated principal.
2. Confirm the response is `401 UNAUTHENTICATED` and no row is written.

**Expected outcome**: Unauthenticated attempts are rejected server-side, matching the existing `tests/security/authz-baseline.spec.ts` behavior.

### 4. Ownership cannot be spoofed

1. Run the `ownership.spec.ts` case that sends a request body containing an extraneous owner-like field (e.g., `userId`/`ownerId`) alongside a valid name, using an authenticated fixture for a different principal.
2. Confirm the persisted row's `user_id` always matches the authenticated principal, never the payload field.

**Expected outcome**: The stored owner is always derived from the server-resolved session.

## Standard Validation Commands

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

**Expected outcome**: All commands pass after HU03 implementation.

## Subject Feature Files

- `server/api/subjects/index.post.ts`
- `server/utils/subjects/schemas.ts`
- `server/utils/subjects/repository.ts`
- `app/components/subjects/SubjectForm.vue`
- `app/pages/subjects/index.vue`
- `tests/subjects/schema.spec.ts`
- `tests/subjects/create-subject.spec.ts`
- `tests/subjects/ownership.spec.ts`
