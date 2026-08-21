# Quickstart: Study Session Recording

## Purpose

Validate that an authenticated student can record valid study time, that invalid duration is rejected, and that subject/task ownership is enforced end to end.

## Prerequisites

- Supabase project configured with the environment variables in `.env.example`.
- Authenticated test account.
- Existing subject owned by that account.
- Optional existing task owned by that account under the selected subject.
- A second account and resource for ownership rejection checks.
- Migrations applied to the target Supabase project.

## Validation Scenarios

### 1. Create a session for a subject

1. Sign in as Student A.
2. Submit `POST /api/study-sessions` with Student A's `subjectId` and `durationMinutes: 45`.
3. Confirm the response is `201` and contains one session.
4. Query the database or the authenticated listing surface used by the test harness.

**Expected outcome**: The record persists with Student A as owner, the selected subject, and 45 minutes.

### 2. Create a session linked to a task

1. Sign in as Student A.
2. Submit a valid request with Student A's subject, a task under that subject, and a positive whole duration.
3. Confirm the session stores both references.

**Expected outcome**: The task association is retained and is consistent with the selected subject.

### 3. Reject invalid duration

Try zero, a negative number, a decimal, a string, a missing value, and `1441` minutes.

**Expected outcome**: Each request returns `422 VALIDATION_ERROR` and creates no session.

### 4. Reject unauthorized references

1. Sign in as Student B.
2. Submit Student A's subject id.
3. Repeat with Student A's task id and Student B's subject id.

**Expected outcome**: Each request returns the safe `404 NOT_FOUND` response and creates no session.

### 5. Run automated checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

**Expected outcome**: All checks pass, including validation, route, ownership, repository, and migration/RLS-focused tests.

## Validation Evidence

- `npx vitest run tests/study-sessions`: passed, 21 tests.
- `npx vitest run tests/unit/auth/route-protection.spec.ts tests/study-sessions`: passed, 31 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed with one pre-existing warning in `app/components/PasswordInput.vue`.
- `npm run test`: passed, 27 files and 252 tests.
- `npm run build`: passed; the production output includes the study-session page and API route.
- Live Supabase migration/RLS smoke test: pending because this workspace has no `.env` credentials. Do not mark AC01-AC04 as production-validated until the two-user scenario is executed against a real Supabase project.
