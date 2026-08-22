# Tasks: Form Feedback and Page Metadata Polish

**Input**: Design documents from `/specs/012-form-feedback-polish/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by acceptance criterion so each fix can be implemented and verified independently. Production changes remain limited to the four files named in the specification.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: User Story 1 - Subject edit character counters (AC06)

**Goal**: Make both subject edit fields expose live counters using the exact `current/max` pattern already used by `SubjectForm.vue`.

**Independent Test**: Open an existing subject editor, verify both counters include initial values, change each field, and verify only its corresponding counter updates.

- [x] T001 [US1] Add the name counter below the name input in `app/components/subjects/SubjectEditForm.vue`, using `form.name.length` and the existing `NAME_MAX_LENGTH` constant with the same markup/display convention as `SubjectForm.vue`.
- [x] T002 [US1] Add the description counter below the description textarea in `app/components/subjects/SubjectEditForm.vue`, using `form.description.length` and the existing `DESCRIPTION_MAX_LENGTH` constant with the same markup/display convention as `SubjectForm.vue`.
- [x] T003 [US1] Add focused coverage for AC06 in the existing test structure, including counters initialized from an existing subject and updates after editing name and description values.
- [x] T004 [US1] Verify AC06 does not alter subject edit validation, submit payload trimming, loading state, cancellation, or update behavior.

**Checkpoint**: Subject edit displays accurate counters for both fields without changing its existing workflow.

## Phase 2: User Story 2 - Clear authentication field errors while editing (AC07)

**Goal**: Remove only the edited field's validation message on every `input` event in registration and login forms.

**Independent Test**: Produce both email and password validation errors, edit one field at a time on each page, and verify only the edited field's message clears.

- [x] T005 [P] [US2] Add a field-specific input handler in `app/pages/register.vue` that removes only `fieldErrors.email` when the email input emits `input`.
- [x] T006 [P] [US2] Add a field-specific input handler in `app/pages/register.vue` that removes only `fieldErrors.password` when the password control emits `input`.
- [x] T007 [P] [US2] Add the corresponding email and password input handlers in `app/pages/login.vue`, preserving the other field's error entry.
- [x] T008 [US2] Bind the handlers to the native email inputs and existing `PasswordInput` controls in both authentication pages without modifying `PasswordInput.vue`.
- [x] T009 [US2] Add focused coverage for AC07 across registration and login, including two simultaneous field errors, independent clearing, repeated input, form-level errors, and registration success feedback preservation.
- [x] T010 [US2] Verify submit-time Zod validation, authentication requests, navigation, and loading/disabled behavior remain unchanged.

**Checkpoint**: Correcting one authentication field removes only that field's stale validation message on both pages.

## Phase 3: User Story 3 - Set the application page title (AC08)

**Goal**: Replace the default Nuxt document title with exactly `StudyFlow`.

**Independent Test**: Load a Nuxt page in the configured browser test or a running application and assert `document.title === 'StudyFlow'`.

- [x] T011 [US3] Set the application-level head title to exactly `StudyFlow` in `nuxt.config.ts` using Nuxt's application head configuration.
- [x] T012 [US3] Add focused coverage for AC08 that verifies the title on a loaded page and confirms the default Nuxt title is absent.
- [x] T013 [US3] Verify the title configuration does not change runtime configuration, routes, page content, or authentication behavior.

**Checkpoint**: The browser identifies the application as `StudyFlow` on page load.

## Phase 4: Regression and Quality

- [x] T014 Run `npm run lint` and confirm no new errors in the four production files or focused tests.
- [x] T015 Run `npm run typecheck` and confirm Vue event bindings and Nuxt configuration are valid.
- [x] T016 Run `npm run test` and confirm the full unit regression suite passes.
- [x] T017 Run `npm run test:e2e` when the configured Supabase test environment is available, and confirm authentication, subject, and page-title flows pass.
- [x] T018 Run `npm run build` and confirm the production Nuxt build succeeds.
- [x] T019 Record focused and regression validation evidence in this file, including any pre-existing warnings or environment limitations.

## Dependencies and Parallelism

- T001 and T002 can be implemented in parallel with T005-T008 and T011 because they touch different production files.
- T003 depends on T001-T002.
- T009 depends on T005-T008.
- T012 depends on T011.
- T014-T018 depend on the relevant implementation and focused test tasks being complete.
- T019 is the final documentation task.

## Scope Guardrails

- Do not modify `PasswordInput.vue`, shared auth schemas, composables, server routes, database migrations, Supabase policies, or shared components.
- Do not implement the other six Issue #60 subtasks.
- Do not change authentication, subject persistence, validation rules, API contracts, or page content beyond the requested feedback and title behavior.

## Validation Evidence

- `npm run lint`: passed with 0 errors and 1 pre-existing warning in `app/components/PasswordInput.vue` (`vue/html-self-closing`), outside this feature's scope.
- `npm run typecheck`: passed.
- `npm run test`: passed, 30 test files and 264 tests.
- `npm run build`: passed; Nitro reports `Build complete!`.
- `npx playwright install chromium firefox` from the VS Code/Copilot integrated terminal: blocked by network `ECONNREFUSED` while downloading browser binaries.
- Chromium was already installed and cached from an earlier session in the same user profile (`%LOCALAPPDATA%\ms-playwright`), so the suite was run from a terminal with working network access instead:
  - `npx playwright test --project=chromium tests/e2e/form-feedback-polish.spec.ts`: initial run found 2 genuine test-authoring bugs (not implementation bugs, confirmed by inspecting the DOM snapshot at failure time — the counters and error message were rendering correctly):
    1. AC06 test's `subjectItem` locator used `.filter({ hasText: subjectName })`, which stopped matching once "Edit" was clicked because the name moved into an `<input value>` (not text content). Fixed to `page.getByRole('listitem').first()`.
    2. The form-level-error test navigated to `/login` while still authenticated from `registerAndLandOnDashboard`, so FR-015's already-authenticated redirect sent it straight to `/dashboard` before the Email field ever appeared. Fixed by logging out and waiting for `/login` first.
  - After both fixes: `npx playwright test --project=chromium tests/e2e/form-feedback-polish.spec.ts` — 5/5 passed.
  - Full regression: `npx playwright test --project=chromium` (all 6 e2e spec files, 27 tests total, including auth, dashboard, navigation, study-sessions, tasks) — 27/27 passed, confirming no regressions elsewhere in the app.
