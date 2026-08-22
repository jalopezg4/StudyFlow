# Quickstart: Form Feedback and Page Metadata Polish

## Prerequisites

- Node.js 22+
- Dependencies installed with `npm install`
- Existing test environment configuration available for the repository's E2E tests

## Focused verification

1. Run `npm run lint` and confirm no new lint errors in the four production files.
2. Run `npm run typecheck` and confirm the Nuxt configuration and Vue event bindings typecheck.
3. Run the focused tests covering:
   - Subject edit name and description counters, including initial values and live updates.
   - Independent clearing of email and password validation errors on registration and login input.
   - Browser title equal to `StudyFlow`.
4. Run `npm run test` for the full unit regression suite.
5. Run `npm run test:e2e` for the full browser regression suite where the configured Supabase test environment is available.
6. Run `npm run build` to verify production Nuxt configuration.

## Manual acceptance smoke check

- Open an existing subject editor and verify both counters show `current/max` using the 100-character name limit and 500-character description limit.
- Submit login or registration with invalid email and password, edit only one field, and verify only that field's message disappears.
- Load any page and verify the browser tab title is exactly `StudyFlow`.

No backend, database, shared-component, or unrelated Issue #60 changes should be necessary.
