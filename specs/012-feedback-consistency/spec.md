# Feature Specification: UI State & Feedback Consistency

**Feature Branch**: `feat/HU12-feedback-consistency`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "Clear the stale 'Subject created successfully' message when the student edits the form again (e.g. a watch on form.name/form.description that resets status to 'idle'). (AC05) File: app/components/subjects/SubjectForm.vue

User Story
As a student,
I want every screen to always show me current, accurate state and clear my stale messages when they're no longer true,
so I never wonder whether my action actually worked or am misled by leftover text.

Business Value
Trust in the app's feedback loop is foundational. If a screen shows stale success text, swallows a real error, or never tells you what changed, students stop trusting every other screen too.

Description
Ten independent, single-file fixes. None add, change, or query anything in Supabase — every fix either wires up an event/expose that's already the established pattern elsewhere in the app, or fixes local component state that never gets reset.

Acceptance Criteria
AC01 — Live refresh after recording a session
Given a student submits the 'record study session' form, when it succeeds, then the new session immediately appears in the list below, with no manual reload.

AC02 — Real edit/delete errors for sessions
Given editing or deleting a session fails, when the error is returned, then the actual error message is shown next to that session, not silently dropped.

AC03 — Consistent confirm pattern for sessions
Given a student clicks 'Delete' on a session, then it uses the same inline confirm-then-button pattern already used by Subjects and Tasks, not a native window.confirm dialog.

AC04 — Recorded date visible
Given a student views their recorded sessions, then each session shows when it was recorded.

AC05 — No stale 'success' banners
Given a student successfully creates a subject or task, when they start editing the form again for a new entry, then the previous 'created successfully' message is cleared instead of lingering.

AC06 — Character counters match everywhere
Given a student is editing an existing subject or task (not just creating one), then they see the same 'X/limit' character counters the creation forms already show.

AC07 — No stale field errors
Given a student sees a 'Title is required' / invalid-email style field error on login or register, when they start correcting that field, then the error clears instead of staying on screen after it's no longer true.

AC08 — Real page title
Given a student looks at the browser tab, then it reads 'StudyFlow' instead of the Nuxt default."

## Clarifications

### Session 2026-08-22

- Q: Should fixing the session edit/delete errors (US1, FR-002/FR-003) also add the same in-flight "disabled while pending" button state that Subjects and Tasks already use, or is showing the real error message enough on its own? → A: Also disable the relevant buttons while the edit/delete request is pending, matching Subjects/Tasks exactly (full behavioral parity, not just error visibility).
- Q: What level of detail should the recorded date on each study session show — a date only, or a date and time? → A: Date and time (e.g., "Aug 22, 2026, 3:45 PM") — distinguishes multiple sessions logged the same day; the underlying timestamp already has this precision.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trustworthy feedback for recorded study sessions (Priority: P1)

As an authenticated student, I want the study-sessions screen to always reflect what actually happened — a new session appears right away, a failed edit or delete tells me why, deleting asks me to confirm the same way every other delete in this app does, and every session shows when it was recorded — so I never have to second-guess whether my study-session history is accurate.

**Why this priority**: This is the most-used, most consequential cluster of gaps — a student who records study time and doesn't see it, or deletes a session and gets no feedback on failure, is directly misled about their own study history, which is the entire purpose of this feature area.

**Independent Test**: An authenticated student can record a session and see it appear without reloading; trigger a failing edit and a failing delete on a session, see the real error each time, and see the acting control disabled only while that request was pending; delete a session using the same confirm-then-button flow already used for subjects/tasks; and see a date and time on every session in the list — all verifiable without touching any other part of the app.

**Acceptance Scenarios**:

1. **Given** a student submits the "record study session" form, **When** it succeeds, **Then** the new session immediately appears in the list below, with no manual reload.
2. **Given** editing a session fails, **When** the error is returned, **Then** the actual error message is shown next to that session, not silently dropped, and the save control is disabled only while that request was pending.
3. **Given** deleting a session fails, **When** the error is returned, **Then** the actual error message is shown next to that session, not silently dropped, and the delete controls are disabled only while that request was pending.
4. **Given** a student clicks "Delete" on a session, **Then** it uses the same inline confirm-then-button pattern already used by Subjects and Tasks, not a native browser confirmation dialog.
5. **Given** a student views their recorded sessions, **Then** each session shows the date and time it was recorded.

---

### User Story 2 - No stale success or error messages anywhere (Priority: P1)

As an authenticated student, I want a "created successfully" message or a field-level validation error to disappear as soon as it stops being true, so leftover text from a previous action never makes me think something is still valid, still failing, or still just-completed when it isn't.

**Why this priority**: This is the foundational trust problem named directly in the ticket's own business value: a screen that keeps showing old text after the state has moved on is actively misleading, not just untidy — and it recurs across the app's two most-used creation forms (subjects, tasks) and both auth forms (login, register).

**Independent Test**: A student can create a subject (or task), see the success message, start typing a new entry, and confirm the old success message is gone; separately, a student can trigger a field-level error on login or register, start correcting that field, and confirm the old error is gone — both without needing any other fix in this feature to be present.

**Acceptance Scenarios**:

1. **Given** a student successfully creates a subject, **When** they start editing the form again for a new entry, **Then** the previous "created successfully" message is cleared instead of lingering.
2. **Given** a student successfully creates a task, **When** they start editing the form again for a new entry, **Then** the previous "created successfully" message is cleared instead of lingering.
3. **Given** a student sees a field-level error (e.g., "Title is required", an invalid-email message) on login, **When** they start correcting that field, **Then** the error clears instead of staying on screen after it's no longer true.
4. **Given** a student sees a field-level error on register, **When** they start correcting that field, **Then** the error clears instead of staying on screen after it's no longer true.

---

### User Story 3 - Editing shows the same guidance as creating (Priority: P2)

As an authenticated student, I want the same "current/limit" character-count guidance while editing an existing subject or task that I already see while creating one, so I'm not left guessing how much room I have left just because I'm editing instead of creating.

**Why this priority**: A real, verified inconsistency, but a guidance gap rather than a misleading-state problem — editing still works correctly today, it's just less helpful than creating, so it ranks below the P1 stories above.

**Independent Test**: A student editing an existing subject, and separately an existing task, can see a live "current/limit" counter under the description field, matching what the creation form for that same entity already shows — independent of any other story in this feature.

**Acceptance Scenarios**:

1. **Given** a student is editing an existing subject, **Then** they see the same "X/limit" character counters the subject creation form already shows.
2. **Given** a student is editing an existing task, **Then** they see the same "X/limit" character counters the task creation form already shows.

---

### User Story 4 - The browser tab identifies the app (Priority: P3)

As anyone visiting the site, authenticated or not, I want the browser tab to read "StudyFlow" instead of a generic framework default, so I can find the right tab among others and know I'm looking at the real application.

**Why this priority**: Real and verifiable, but the lowest-impact gap in this set — it never blocks or misleads a student mid-task the way the other stories' gaps do.

**Independent Test**: Anyone can load any page of the application, authenticated or not, and confirm the browser tab title reads "StudyFlow" — independent of every other story in this feature.

**Acceptance Scenarios**:

1. **Given** a student looks at the browser tab, **Then** it reads "StudyFlow" instead of the Nuxt default.

---

### Edge Cases

- What happens if a student edits a field back to the exact value it had when a stale success/error message was still showing? The message must still be cleared as soon as editing begins — it is not restored just because the value matches what it was before.
- What happens on the very first keystroke made while a stale success or field-level error message is visible? The message must clear immediately on that first change, not only after the field loses focus or the form is resubmitted.
- What happens if a student submits the "record study session" form again immediately, before visually confirming the first submission appeared? Each successful submission must independently result in its own session appearing in the list, with no manual reload needed for either.
- What happens to the recorded-date-and-time display for a session created long ago (weeks or months prior)? It must still render as a valid, readable date and time regardless of age.
- What happens when a student navigates away from a page with a stale message and back again? Since this concerns state within a single, continued editing session on one page load, a fresh page load naturally starts with no stale message; the fixes in this feature concern messages lingering across a student's continued interaction without reloading.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST update the visible recorded-sessions list immediately after a study session is successfully recorded, without requiring a manual page reload.
- **FR-002**: The system MUST display the actual server-returned error next to the affected session when editing a recorded study session fails, and MUST disable that session's editing controls only while the edit request is pending, matching the loading-state pattern already used for subjects and tasks.
- **FR-003**: The system MUST display the actual server-returned error next to the affected session when deleting a recorded study session fails, and MUST disable that session's delete controls only while the delete request is pending, matching the loading-state pattern already used for subjects and tasks.
- **FR-004**: The system MUST use the same in-page, two-step confirm-then-button pattern already used when deleting a subject or a task when deleting a recorded study session, instead of a native browser confirmation dialog.
- **FR-005**: The system MUST display the date and time a study session was recorded alongside each entry in the recorded-sessions list.
- **FR-006**: The system MUST clear a "created successfully" confirmation message on the subject creation form as soon as the student begins editing that form again for a new entry.
- **FR-007**: The system MUST clear a "created successfully" confirmation message on the task creation form as soon as the student begins editing that form again for a new entry.
- **FR-008**: The system MUST clear a field-level validation error on the login form as soon as the student edits that field again, regardless of whether the new value is itself valid.
- **FR-009**: The system MUST clear a field-level validation error on the register form as soon as the student edits that field again, regardless of whether the new value is itself valid.
- **FR-010**: The system MUST display the same "current/limit" character-count guidance on the edit form for an existing subject that its creation form already shows.
- **FR-011**: The system MUST display the same "current/limit" character-count guidance on the edit form for an existing task that its creation form already shows.
- **FR-012**: The application MUST present "StudyFlow" as the browser tab title, replacing the framework default, across the application.

### Key Entities *(include if feature involves data)*

- No new or changed entities. This feature only corrects client-side UI state (message lifecycle, displayed fields, confirmation interaction, and page metadata) over data and endpoints that already exist from prior HUs; it introduces no new fields, tables, or API contracts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A newly recorded study session appears in the visible list within the same interaction, with no manual reload, every time.
- **SC-002**: Every failed attempt to edit or delete a recorded study session surfaces a specific, visible error message next to that session, and the acting control is disabled only for the duration of that request, matching Subjects/Tasks.
- **SC-003**: Deleting a study session uses the identical confirmation interaction already used for deleting a subject or a task.
- **SC-004**: Every recorded session displays the date and time it occurred.
- **SC-005**: No student ever sees a "created successfully" message left over from a previous, different submission on the subject or task creation forms.
- **SC-006**: No student ever sees a login or register field-level error that no longer reflects the field's current value.
- **SC-007**: Editing an existing subject or an existing task shows the same character-count guidance as creating one.
- **SC-008**: The browser tab reads "StudyFlow" on every page of the application.

## Assumptions

- This is a client-side UI-state and view-wiring feature only; no server-side route, validation rule, schema, or business logic change is required — consistent with the ticket's own framing that every fix either wires up an event/expose pattern already established elsewhere in the app, or fixes local component state that is never reset.
- "Character-count guidance" on the edit forms (User Story 3) means the same "current/limit" indicator already present on the corresponding creation forms; no new or different length limits are introduced.
- The browser tab title fix (User Story 4) applies globally — to authenticated and unauthenticated pages alike — as a single, static application name, not a per-page dynamic title; per-page titles are not requested by this ticket and are out of scope.
- The ten fixes referenced in the originating ticket correspond to the twelve Functional Requirements above once each per-entity/per-page variant (subjects vs. tasks, login vs. register) is counted individually; each remains independently deliverable and testable, with no fix depending on another.
