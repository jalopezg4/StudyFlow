# Quickstart: UI State & Feedback Consistency Validation

## Purpose

Validate that recorded study sessions always reflect reality, stale success/error messages never linger, edit forms guide as well as creation forms do, and the browser tab identifies the app — all without any Supabase/DB change.

## Prerequisites

- Repository cloned locally; Node.js 22+; `npm ci` run.
- `.env` created from `.env.example` with a Supabase project's URL, anon key, and service role key (non-production values for local work) — unchanged from prior HUs; this feature applies no new migration.
- `npm run dev` (or the Playwright config's own dev-server hook) for manual/automated browser checks.

## Validation Scenarios

### 1. Live refresh after recording a session (AC01)

1. Run the extended `tests/e2e/study-sessions.spec.ts`: register, create a subject, record a session, and assert the session is visible in the list without a page reload.

**Expected outcome**: The newly recorded session appears in "Recorded sessions" in the same interaction (SC-001).

### 2. Real, per-row edit/delete errors with correct disabled state (AC02)

1. Run the extended `tests/e2e/study-sessions.spec.ts` cases that force an edit failure (e.g., an out-of-range duration reaching the server) and a delete failure, and assert: (a) the real error text appears next to that session, and (b) the acting button is disabled only while that request is in flight, then re-enabled.

**Expected outcome**: No failure is silently dropped; no button stays disabled after its request resolves (SC-002).

### 3. Consistent inline confirm for session deletion (AC03)

1. Run the extended `tests/e2e/study-sessions.spec.ts` case that clicks "Delete" on a session and asserts the same inline "Confirm delete / Cancel" controls used by Subjects/Tasks appear — and that no native browser dialog is invoked.

**Expected outcome**: Deleting a session behaves identically, interaction-wise, to deleting a subject or a task (SC-003).

### 4. Recorded date and time visible (AC04)

1. Run the extended `tests/e2e/study-sessions.spec.ts` case that records a session and asserts a date-and-time string is rendered next to it.

**Expected outcome**: Every session in the list shows when it was recorded, down to the time (SC-004).

### 5. No stale "created successfully" banners (AC05)

1. Run `tests/e2e/feedback-consistency.spec.ts`'s subject-creation case: create a subject, see the success message, start typing a new name, and assert the success message is gone.
2. Repeat for task creation.

**Expected outcome**: A success message never survives into the next attempt at creating a new entry (SC-005).

### 6. Character counters on edit forms (AC06)

1. Run `tests/e2e/feedback-consistency.spec.ts`'s edit-form cases: open the edit form for an existing subject, and separately an existing task, and assert a "current/limit" counter is visible and updates as the student types.

**Expected outcome**: Editing offers the same length guidance as creating (SC-007).

### 7. No stale field errors on login/register (AC07)

1. Run `tests/e2e/feedback-consistency.spec.ts`'s auth-form cases: trigger a field-level error on login (and separately on register), start correcting that field, and assert the error is gone before resubmitting.

**Expected outcome**: A field error never outlives the value that caused it (SC-006).

### 8. Real page title (AC08)

1. Run `tests/e2e/feedback-consistency.spec.ts`'s title case: load any page and assert `page.title()` equals `"StudyFlow"`.

**Expected outcome**: The browser tab identifies the application by name everywhere (SC-008).

## Standard Validation Commands

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`
6. `npm run test:e2e`

**Expected outcome**: All commands pass after this feature's implementation.

## Files Touched

- `app/components/subjects/SubjectForm.vue`
- `app/components/subjects/SubjectEditForm.vue`
- `app/components/tasks/TaskForm.vue`
- `app/components/tasks/TaskEditForm.vue`
- `app/components/study-sessions/StudySessionList.vue`
- `app/pages/study-sessions/index.vue`
- `app/pages/login.vue`
- `app/pages/register.vue`
- `nuxt.config.ts`
- `tests/e2e/study-sessions.spec.ts` (extended)
- `tests/e2e/feedback-consistency.spec.ts` (new)
