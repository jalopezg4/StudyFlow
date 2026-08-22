# Quickstart: Study Progress Dashboard

## Purpose

Validate that an authenticated student can view task completion and study-time metrics calculated exclusively from their own data.

## Prerequisites

- Supabase project configured with `.env`.
- An authenticated test account.
- Test data for at least two users when validating isolation.
- Existing subjects, tasks, and study sessions created through the previous HUs.

## Validation Scenarios

### 1. View populated progress

1. Sign in as Student A.
2. Create four tasks: two pending and two completed.
3. Create study sessions totaling 135 minutes across three records.
4. Open `/dashboard`.

**Expected outcome**: The dashboard shows 4 total tasks, 2 completed, 2 pending, 50% completion, 3 sessions, and 135 study minutes.

### 2. View the empty state

1. Sign in as a new student with no tasks or sessions.
2. Open `/dashboard`.

**Expected outcome**: The dashboard shows zero metrics and a clear empty-state message without an error.

### 3. Validate task-only activity

1. Sign in as a student with tasks but no sessions.
2. Open `/dashboard`.

**Expected outcome**: Task metrics are accurate and study sessions/minutes are zero.

### 4. Validate ownership isolation

1. Create different task/session data for Student A and Student B.
2. Open the dashboard as Student A.
3. Repeat as Student B.

**Expected outcome**: Each dashboard shows only its own counts and minutes. Direct unauthenticated requests to `GET /api/dashboard/progress` return `401 UNAUTHENTICATED`.

### 5. Run automated checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

**Expected outcome**: All checks pass, including aggregation, empty-state, ownership, route protection, and UI tests.

## Validation Evidence

- `npx vitest run tests/dashboard tests/unit/auth/route-protection.spec.ts`: passed, 17 tests.
- `npx playwright test tests/e2e/dashboard.spec.ts --list`: passed, 6 tests discovered across Chromium and Firefox.
- `npm run lint`: passed with one pre-existing warning in `app/components/PasswordInput.vue`.
- `npm run test`: passed, 29 files and 259 tests.
- `npm run build`: passed; the dashboard page and `GET /api/dashboard/progress` route are included in the production output.
- Live two-user Supabase/RLS smoke test: pending because this workspace has no `.env` credentials. Do not mark AC01-AC05 as production-validated until the populated, empty, and isolation scenarios are executed against a real Supabase project.
