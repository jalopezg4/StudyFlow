# Feature Specification: Study Session Feedback & Refresh Fixes

**Feature Branch**: `001-fix-session-feedback-loop`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "Implement 3 of the tasks from GitHub Issue #60 (US12 — Fix Broken Feedback & State Loops): the study session recording form, the study sessions page, and the recorded sessions list must work together so that (1) a newly recorded session appears in the list immediately without a manual reload, (2) real edit/delete error messages are shown next to the affected session instead of being silently dropped, (3) deleting a session uses the same inline confirm-then-button pattern already used for Subjects and Tasks instead of a native browser confirm dialog, and (4) each recorded session shows the date it was recorded."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See a newly recorded session right away (Priority: P1)

As a student, after I submit the "record study session" form, I want the new session to show up in the list below immediately, so I don't wonder whether it actually saved.

**Why this priority**: This is the core trust-building loop for the whole page — recording a session is the primary action on this screen, and if the result isn't visible, students can't tell if the app worked.

**Independent Test**: Can be fully tested by submitting a valid "record study session" form and observing that the new entry appears in the recorded sessions list without a manual page reload.

**Acceptance Scenarios**:

1. **Given** a student is on the study sessions page with an existing list of recorded sessions, **When** they successfully submit the record study session form, **Then** the newly recorded session appears in the list below without any manual reload.
2. **Given** a student has no recorded sessions yet, **When** they successfully submit the record study session form, **Then** the list updates from "no recorded sessions" to showing the new session.

---

### User Story 2 - Know when an edit or delete actually failed (Priority: P1)

As a student, when editing or deleting a recorded session fails, I want to see the real error message next to that session, so I know my action didn't work and why.

**Why this priority**: Silently swallowing errors is the most damaging trust failure — a student may believe an edit or delete succeeded when it did not, and take no corrective action.

**Independent Test**: Can be fully tested by triggering an edit or delete failure on a session (e.g. invalid input or a backend error) and confirming the specific error message renders next to that session, regardless of how long the page has been loaded or what else happened before.

**Acceptance Scenarios**:

1. **Given** a student is editing the duration of a recorded session, **When** the save fails, **Then** the actual error message is shown next to that session.
2. **Given** a student attempts to delete a recorded session, **When** the deletion fails, **Then** the actual error message is shown next to that session instead of failing silently.
3. **Given** an error message is already showing next to a session, **When** the student retries the action and it succeeds, **Then** the error message for that session is cleared.

---

### User Story 3 - Delete a session with the same confirm pattern used elsewhere (Priority: P2)

As a student, when I click "Delete" on a recorded session, I want the same inline confirm-then-button pattern I already see for Subjects and Tasks, so the app feels consistent and I don't get an intrusive browser popup.

**Why this priority**: Consistency reduces confusion and builds trust, but the app is still usable (if jarring) with a native confirm dialog, so this ranks below the correctness fixes above.

**Independent Test**: Can be fully tested by clicking "Delete" on a recorded session and confirming an inline confirmation step appears in the page (not a native browser dialog), which must be explicitly confirmed before the session is removed, and can be cancelled without deleting anything.

**Acceptance Scenarios**:

1. **Given** a student clicks "Delete" on a recorded session, **When** the action is triggered, **Then** an inline confirmation step appears in the page asking them to confirm, with no native browser confirmation dialog involved.
2. **Given** a student is shown the inline delete confirmation for a session, **When** they confirm, **Then** the session is deleted and removed from the list.
3. **Given** a student is shown the inline delete confirmation for a session, **When** they cancel instead, **Then** the session is not deleted and the confirmation step closes.

---

### User Story 4 - See when each session was recorded (Priority: P3)

As a student, when I view my recorded sessions, I want to see the date each one was recorded, so I can tell my study history apart.

**Why this priority**: This is a visibility gap rather than a correctness bug — the data already exists, it's just not shown — so it's the lowest-risk, lowest-priority fix of the four.

**Independent Test**: Can be fully tested by viewing the recorded sessions list and confirming every entry displays the date/time it was recorded.

**Acceptance Scenarios**:

1. **Given** a student views their list of recorded sessions, **When** the list renders, **Then** each session shows the date it was recorded.

---

### Edge Cases

- What happens if a student is in the middle of editing one session when a new session is recorded and the list refreshes? The in-progress edit should not be lost or silently discarded by the refresh.
- What happens if a delete fails after the student confirmed it? The error must be shown next to that session, and the inline confirmation step should let the student retry or cancel rather than getting stuck.
- What happens if a student opens the delete confirmation for one session and then requests delete on a different session? Only one session's confirmation should be active at a time.
- What happens when a session record has no recorded-date value available? The list should not break rendering for the other sessions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST refresh the recorded sessions list immediately after a study session is successfully recorded, with no manual reload required from the student.
- **FR-002**: System MUST show the specific error message next to a session when editing that session fails, instead of dropping the error silently.
- **FR-003**: System MUST show the specific error message next to a session when deleting that session fails, instead of dropping the error silently.
- **FR-004**: System MUST use an inline, two-step confirm-then-confirm pattern for deleting a recorded session, matching the pattern already used for deleting Subjects and Tasks, instead of a native browser confirmation dialog.
- **FR-005**: Students MUST be able to cancel a pending delete confirmation for a session without the session being deleted.
- **FR-006**: System MUST display the date a session was recorded for every session shown in the recorded sessions list.

### Key Entities *(include if feature involves data)*

- **Study Session**: A record of time a student spent studying, already including a duration, an associated subject, an optional associated task, and the date it was recorded. This feature does not add or change what a study session stores — it only fixes how the existing recorded-date, error state, and list contents are surfaced to the student.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful study session submissions result in the new session being visible in the recorded sessions list with zero additional actions (no reload, no navigation) from the student.
- **SC-002**: 100% of failed session edit or delete attempts display a specific, non-generic error message next to the affected session.
- **SC-003**: 100% of session deletions require an explicit two-step confirmation before the session is removed, and can be cancelled with zero unintended deletions.
- **SC-004**: 100% of recorded sessions display their recorded date when viewed in the list.

## Assumptions

- This feature covers only the study-session recording form, the study sessions page, and the recorded sessions list — the other seven fixes described in Issue #60 (subjects/tasks banners, character counters, login/register field errors, page title) are explicitly out of scope for this spec.
- The recorded-date value for each study session already exists in the data returned to the page; this feature only makes it visible, it does not introduce a new field.
- "Immediately" in FR-001/SC-001 means the list reflects the new session as part of the same successful-submission flow, without the student needing to trigger any separate action.
- The inline two-step confirm pattern referenced in FR-004 should look and behave consistently with the existing Subjects and Tasks delete confirmations, from the student's point of view (a request step, then an explicit confirm or cancel).
