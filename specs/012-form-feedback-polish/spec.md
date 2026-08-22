# Feature Specification: Form Feedback Polish (US12 subtasks 7-10)

**Feature Branch**: `[012-form-feedback-polish]`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "US12 (Issue #60) subtasks 7, 8, 9, 10: add a character counter to SubjectEditForm.vue matching the creation-form pattern (AC06); clear field-level validation errors as the user corrects them on register.vue and login.vue (AC07); set the real page title in nuxt.config.ts instead of the default Nuxt value (AC08)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Character counter while editing a subject (Priority: P2)

As a student editing an existing subject, I want to see how many characters I've used in the name and description fields, so I know how close I am to the limit before I try to save.

**Why this priority**: Cosmetic parity fix — the creation form already has this, its absence on the edit form is a visible inconsistency but not a blocker to using the app.

**Independent Test**: Open the edit form for any subject, type in the name or description field, and observe a live `used/max` counter under each field, matching what the "create subject" form already shows.

**Acceptance Scenarios**:

1. **Given** the subject edit form is open, **When** the student types in the Name field, **Then** a counter below the field shows the current length out of the 100-character maximum, updating on every keystroke.
2. **Given** the subject edit form is open, **When** the student types in the Description field, **Then** a counter below the field shows the current length out of the 500-character maximum, updating on every keystroke.

---

### User Story 2 - Field errors clear as the student corrects them (Priority: P1)

As a student filling out the registration or login form, I want a field's error message to disappear as soon as I fix that field, so stale error text doesn't make me think my correction didn't work.

**Why this priority**: Directly affects trust in the auth flow (the entry point to the whole app) — a stale error next to a now-valid field is actively misleading, not just cosmetic.

**Independent Test**: Trigger a validation error on the email or password field (submit invalid input), then start typing a corrected value in that same field without resubmitting, and observe the error message disappear immediately.

**Acceptance Scenarios**:

1. **Given** the registration form shows a field error for Email or Password after a failed submit, **When** the student edits that field's value, **Then** that field's error message clears immediately, without needing to resubmit the form.
2. **Given** the login form shows a field error for Email or Password after a failed submit, **When** the student edits that field's value, **Then** that field's error message clears immediately, without needing to resubmit the form.
3. **Given** both fields show errors, **When** the student edits only one of them, **Then** only that field's error clears; the other field's error remains until it is also edited.

---

### User Story 3 - Correct browser tab title (Priority: P3)

As a student with several browser tabs open, I want the StudyFlow tab to say "StudyFlow" instead of a generic default, so I can find it at a glance.

**Why this priority**: Pure polish, zero functional impact, but trivial to fix.

**Independent Test**: Open any page of the app and read the browser tab title.

**Acceptance Scenarios**:

1. **Given** the student opens any page of the app, **When** the page loads, **Then** the browser tab title reads "StudyFlow".

---

### Edge Cases

- Clearing a field error must only affect the field being edited — editing the email field must never clear a still-invalid password field's error, and vice versa (per US2 CA03).
- The character counter must reflect the field's actual current value at all times, including after the value is programmatically reset (e.g., after a successful save that repopulates the form), not just user keystrokes.
- The counter must not itself block typing past the limit differently than today — the existing `maxlength` attribute already prevents that; this feature only adds the visible count, it does not change validation behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The subject edit form MUST display a live character counter (`current/max`) below the Name field, using the same 100-character maximum already enforced by validation.
- **FR-002**: The subject edit form MUST display a live character counter (`current/max`) below the Description field, using the same 500-character maximum already enforced by validation.
- **FR-003**: On the registration form, editing a field that currently shows a validation error MUST clear that field's error message immediately, without requiring a form resubmission.
- **FR-004**: On the login form, editing a field that currently shows a validation error MUST clear that field's error message immediately, without requiring a form resubmission.
- **FR-005**: Clearing a field's error on edit MUST be scoped to that field only; other fields' errors are unaffected.
- **FR-006**: The application MUST set a real page title of "StudyFlow" instead of the Nuxt default, applied globally so it appears on every page.

### Key Entities

No data entities involved — this feature only touches client-side form UI state and static app configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of keystrokes in the subject edit form's Name/Description fields are reflected in their counters within the same render (no perceptible lag).
- **SC-002**: 100% of corrected fields on register/login clear their error message without a page reload or resubmission.
- **SC-003**: The browser tab shows "StudyFlow" on 100% of pages, verified by inspecting the document title.

## Assumptions

- This spec covers only subtasks 7, 8, 9, and 10 of the parent issue (US12 / Issue #60); the other 6 subtasks (study-session list/form refresh, subject/task creation-form stale-success clearing, task edit-form counter) are out of scope here and are being handled independently by teammates in parallel, per the issue's own note that all ten fixes are single-file and merge-order independent.
- The character counter format and styling exactly mirror the existing pattern in `SubjectForm.vue` (`{{ value.length }}/{{ MAX_LENGTH }}`, `text-xs text-slate-400`) for visual consistency; no new design decision is being made here.
- "Clearing a field error on edit" means clearing it on the `input` event (as the user types), not only on blur — this gives the fastest possible feedback and matches the user story's "as I correct them" framing.
