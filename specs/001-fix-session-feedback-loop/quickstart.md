# Quickstart: Validate Study Session Feedback & Refresh Fixes

## Prerequisites

- Repo installed (`npm install`) and Supabase env vars configured as usual for local dev
  (see project README / `.env`).
- Dev server running: `npm run dev`
- A logged-in test student account with at least one Subject already created.

## Manual validation (fastest, matches the four user stories)

1. **US1 — Live refresh (AC01)**
   - Go to `/study-sessions`.
   - Submit the "Record study session" form with a valid subject and duration.
   - Expect: the new session appears in the "Recorded sessions" list immediately, with no
     page reload.

2. **US2 — Real edit/delete errors (AC02)**
   - With at least one recorded session visible, temporarily force a failure (e.g. stop the
     dev server's network briefly, or use browser devtools to block the PATCH/DELETE
     request), then attempt to edit a session's duration and save.
   - Expect: a specific error message appears next to that session, not silently nothing.
   - Repeat for delete.

3. **US3 — Inline confirm pattern (AC03)**
   - Click "Delete" on a session.
   - Expect: an inline confirmation block appears in the page (matching the look of
     Subjects' delete confirmation) — no native browser `confirm()` popup.
   - Click "Cancel" — expect the session is not deleted and the confirmation closes.
   - Click "Delete" again, then confirm — expect the session is removed from the list.

4. **US4 — Recorded date visible (AC04)**
   - Look at any session in the "Recorded sessions" list.
   - Expect: a recorded date is shown alongside the duration/subject/task info.

## Automated validation

- Run unit/server tests (unaffected by this feature, should stay green):
  `npm run test`
- Extend and run the existing E2E spec for this feature:
  `npx playwright test tests/e2e/study-sessions.spec.ts`
  - Add scenarios asserting: list contains the new session right after submit (no reload),
    an inline confirm step (not a native dialog) is required before delete, and the
    recorded date is visible per session.
- Full quality gate before PR (per constitution):
  `npm run lint && npm run typecheck && npm run test && npm run test:e2e && npm run build`

## Expected outcome

All four acceptance criteria (AC01–AC04) pass manually and are covered by an extended
Playwright spec, with no changes to `server/api/study-sessions/*` or the database.
