# Tasks: Form Feedback Polish (US12 subtasks 7-10)

**Input**: Design documents from `/specs/012-form-feedback-polish/`

**Organization**: One phase per user story; all are independent (no shared files, no ordering dependency).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: User Story 1 - Character counter on subject edit (Priority: P2)

- [x] T001 [US1] Add live `{{ value.length }}/{{ MAX }}` counters under Name and Description fields in app/components/subjects/SubjectEditForm.vue, matching the pattern in app/components/subjects/SubjectForm.vue

## Phase 2: User Story 2 - Clear field errors while typing (Priority: P1)

- [x] T002 [P] [US2] Clear `fieldErrors.email`/`fieldErrors.password` on input (per-field, not both at once) in app/pages/register.vue
- [x] T003 [P] [US2] Clear `fieldErrors.email`/`fieldErrors.password` on input (per-field, not both at once) in app/pages/login.vue
- [x] T004 [P] [US2] E2E test: editing one field clears only that field's error, leaves the other untouched, in tests/e2e/auth.spec.ts — **deviation**: written as a Playwright test, not a Vitest unit test, since the codebase has no existing pattern for mounting/unit-testing `<script setup>` page components (every existing Vitest unit test targets pure logic — schemas, session resolution, route-protection — never a mounted component), and this behavior is inherently about rendered DOM state (an error `<p>` appearing/disappearing), which Playwright already covers end-to-end for this exact form.

## Phase 3: User Story 3 - Correct browser tab title (Priority: P3)

- [x] T005 [US3] Set `app.head.title = "StudyFlow"` in nuxt.config.ts

## Dependencies

None — all three phases touch disjoint files and can be done in any order or in parallel.

## Validation Evidence

- `npm run lint`: passed (1 pre-existing warning in PasswordInput.vue, unrelated to this change, not introduced here).
- `npm run typecheck`: passed, no errors.
- `npm run test` (Vitest): passed — 30 files, 264 tests.
- `npm run test:e2e -- --project=chromium tests/e2e/auth.spec.ts` (Playwright, against a real Supabase project): passed — 8/8, including the new "clears a field error as soon as the student corrects it (US12 AC07)" test.
- `npm run build`: passed.
- Manual verification in-browser (dev server):
  - AC06: created a subject named "US12 Test Subject" (17 chars), opened its edit form, saw `17/100` / `0/500` counters render immediately; typed 6 more characters and watched the counter update live to `23/100`.
  - AC08: browser tab title reads "StudyFlow" on every page (confirmed on `/`, `/login`, `/register`, `/subjects`).
