# Feature Specification: Form Feedback and Page Metadata Polish

**Feature Branch**: `feat/US12-form-feedback-polish`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "US12 (Issue #60) subtasks 7, 8, 9, 10: add a character counter to SubjectEditForm.vue matching the creation-form pattern used in SubjectForm.vue (AC06); clear field-level validation errors as the user corrects them on register.vue and login.vue, per-field, on the input event (AC07); set the real page title to `StudyFlow` in nuxt.config.ts instead of the default Nuxt value (AC08). Scope is limited to these 4 subtasks only — the other 6 subtasks of Issue #60 are being handled independently by teammates in parallel, per the issue's own note that all ten fixes are single-file and merge-order independent. No backend, database, or shared-component changes."

## User Story

As a StudyFlow user, I want form feedback and page metadata to be clear and responsive, so that I can correct invalid input easily and recognize the application in the browser.

## Acceptance Criteria

- **AC06**: `SubjectEditForm.vue` displays character counters for the subject name and description fields, matching the existing `SubjectForm.vue` pattern and maximum lengths. The counters update as the user types and do not change the existing validation or submit behavior.
- **AC07**: `register.vue` and `login.vue` clear a field's validation error when the user emits an `input` event for that field. Clearing one field's error MUST NOT clear another field's error, form-level errors, or success messages. Existing validation on submit remains unchanged.
- **AC08**: The Nuxt application sets the browser document title to exactly `StudyFlow` through `nuxt.config.ts`, replacing the default Nuxt title. No unrelated runtime configuration changes are required.

## User Scenarios & Testing

### User Story 1 - Correct subject edits with visible limits (Priority: P1)

As a student editing a subject, I want to see how many characters I have entered and how many remain available, so that I can stay within the accepted limits before submitting.

**Independent Test**: Open an existing subject's edit form, verify counters are visible for name and description, type in either field, and verify its counter reflects the current value length and configured maximum.

**Acceptance Scenarios**:

1. **Given** the subject edit form is open, **When** the form renders, **Then** the name counter shows the current name length and the name maximum, and the description counter shows the current description length and the description maximum.
2. **Given** the student changes the name or description, **When** the input value changes, **Then** only the corresponding counter updates to the new value length.
3. **Given** the student submits the edit form, **When** validation or the update request runs, **Then** existing edit behavior and validation messages remain unchanged.

### User Story 2 - Resolve authentication field errors as I type (Priority: P1)

As a student registering or logging in, I want a field's validation message to disappear when I edit that field, so that stale feedback does not remain after I have corrected the input.

**Independent Test**: Submit each authentication form with invalid values to produce field errors, edit one field, and verify only that field's error clears while any other field error remains until that field is edited.

**Acceptance Scenarios**:

1. **Given** registration has a validation error for email, **When** the email input emits `input`, **Then** the email error is cleared and the password error, if present, is preserved.
2. **Given** registration has a validation error for password, **When** the password input emits `input`, **Then** the password error is cleared and the email error, if present, is preserved.
3. **Given** login has a validation error for either field, **When** that field emits `input`, **Then** only that field's validation error is cleared.
4. **Given** a form-level error or registration success message is displayed, **When** a field emits `input`, **Then** the field-level error handling does not incorrectly remove or alter the form-level message or success message.
5. **Given** an authentication form is submitted again, **When** schema validation runs, **Then** existing validation and authentication behavior remains unchanged.

### User Story 3 - Identify the application in the browser (Priority: P2)

As a StudyFlow user, I want the browser tab to identify the application, so that I can recognize it when multiple tabs are open.

**Independent Test**: Start or build the Nuxt application, open a page, and verify the document title is exactly `StudyFlow` rather than the Nuxt default.

**Acceptance Scenarios**:

1. **Given** any Nuxt page is loaded, **When** the document metadata is applied, **Then** `document.title` is exactly `StudyFlow`.
2. **Given** the application is built or started, **When** Nuxt configuration is loaded, **Then** the title comes from `nuxt.config.ts` and no default Nuxt title is used.

## Functional Requirements

- **FR-001**: The subject edit form MUST expose live character counters for name and description using the same display convention and maximum constants as the subject creation form.
- **FR-002**: Character counters MUST reflect the current value length, including the initial values loaded from the subject being edited.
- **FR-003**: The registration page MUST clear only the edited field's entry in `fieldErrors` on that field's `input` event.
- **FR-004**: The login page MUST clear only the edited field's entry in `fieldErrors` on that field's `input` event.
- **FR-005**: Per-field error clearing MUST work for the password control used by both authentication pages as well as the email input.
- **FR-006**: Submit-time schema validation, authentication requests, navigation, form-level errors, and registration success feedback MUST retain their existing behavior.
- **FR-007**: Nuxt configuration MUST set the application page title to exactly `StudyFlow`.
- **FR-008**: The implementation MUST be limited to `app/components/subjects/SubjectEditForm.vue`, `app/pages/register.vue`, `app/pages/login.vue`, and `nuxt.config.ts`.
- **FR-009**: Focused tests MAY be added or updated to verify AC06 through AC08, but they MUST not require backend, database, shared-component, or unrelated feature changes.

## Key Entities

No new entities. This is a UI feedback and application metadata change over existing forms and configuration.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of subject edit form text fields show a live `current length / maximum length` counter, including when the form is initialized with existing values.
- **SC-002**: In both authentication forms, editing one field clears its own validation error without clearing the other field's validation error in a two-error scenario.
- **SC-003**: A loaded Nuxt page reports `document.title === 'StudyFlow'`.
- **SC-004**: Focused tests for subject editing, authentication, and application startup verify AC06 through AC08, while existing tests continue to pass without backend, database, or shared-component changes.

## Scope

In scope are only the four single-file implementation fixes represented by AC06, AC07, and AC08, plus focused tests for those fixes where appropriate. The six other Issue #60 subtasks are intentionally excluded and are being handled independently by teammates. The changes are merge-order independent.

## Assumptions

- The existing maximums remain authoritative: name is limited to 100 characters and description to 500 characters.
- The existing `PasswordInput` component emits a compatible `input` event through its `v-model` contract; it is not modified as part of this feature.
- Field-level validation errors are the entries in each page's existing `fieldErrors` state; form-level errors and success feedback are separate state and remain untouched by input handlers.
- No new API route, database migration, shared component, validation schema, or reusable composable is needed.
- Focused tests may be added or updated in the existing test structure without changing production ownership boundaries.

## Out of Scope

- The other six Issue #60 subtasks.
- Backend, API, database, Supabase, or RLS changes.
- Changes to shared components, including `PasswordInput.vue`.
- Backend, database, or shared-component test changes.
- Changes to validation schemas or authentication behavior.
- General visual redesign, copy changes, accessibility refactors, or page-title changes beyond the requested `StudyFlow` value.
