# Feature Specification: Study Sessions Feedback Loop

**Feature Branch**: `feat/US12-study-sessions-feedback-loop`

**Created**: 2026-08-22

**Status**: Draft

**Parent Issue**: US12 — Fix Broken Feedback & State Loops (#60). This spec covers only the study-sessions slice of that issue (its first three tasks, AC01–AC04) — a single, independently mergeable slice per that issue's own "Notes for parallel work". The other seven tasks (stale success banners, missing edit-form character counters, stale login/register field errors, page title) belong to other contributors and are out of scope here.

**Input**: User description (from issue #60): "As a student, I want the study-sessions screen to always show me current, accurate state, so I never wonder whether my action actually worked. AC01: Recording a new session immediately shows up in the list below, with no manual reload. AC02: A failed edit or delete shows the real reason on screen. AC03: Every recorded session shows when it happened." (AC03 in this spec corresponds to the parent issue's AC04; this spec's own AC03 below covers the parent issue's AC03, the confirm-dialog consistency requirement.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See a newly recorded session immediately (Priority: P1)

As an authenticated student, I want the session I just recorded to appear in "Recorded sessions" right away, so that I don't wonder whether it actually saved.

**Why this priority**: This is the core trust-building fix — without it, a student has no confirmation their action persisted short of manually reloading the page, which is the exact "broken feedback loop" this issue exists to fix.

**Independent Test**: An authenticated student who submits the record-session form can verify the new session appears in the list below in the same interaction, with no manual page reload.

**Acceptance Scenarios**:

1. **Given** an authenticated student on `/study-sessions`, **When** they submit a valid session, **Then** the session list below refreshes and shows the new session without a manual reload.

---

### User Story 2 - See the real reason an edit or delete failed (Priority: P1)

As an authenticated student, when editing a session's duration or deleting a session fails, I want to see the actual error message, so that I know what went wrong instead of the action silently appearing to do nothing.

**Why this priority**: A silently-swallowed error is worse than no feedback at all — the student can't tell "it worked" from "it's broken," undermining trust in every other action on the page too.

**Independent Test**: A failed edit or delete attempt (e.g., a stale/already-deleted session, or an out-of-range duration) can be verified to display its real error message next to that session, not nothing.

**Acceptance Scenarios**:

1. **Given** a student attempts to save an edited duration and the request fails, **When** the failure is returned, **Then** the actual error message is shown, regardless of whether a page-level error has ever occurred before.
2. **Given** a student attempts to delete a session and the request fails, **When** the failure is returned, **Then** the actual error message is shown next to that session.

---

### User Story 3 - Use the app's own confirm pattern to delete a session (Priority: P2)

As an authenticated student, I want deleting a session to use the same inline "confirm, then click again" pattern already used for subjects and tasks, so the app feels consistent and the flow can be exercised the same way the rest of the app is tested.

**Why this priority**: Consistency and testability matter, but the study-sessions delete flow already works today via the native dialog — this is a polish/consistency fix, not a broken-trust fix like US1/US2.

**Independent Test**: Clicking "Delete" on a session shows an inline confirm-then-button control (no native browser dialog), matching the Subjects/Tasks pattern, and confirming removes the session.

**Acceptance Scenarios**:

1. **Given** a student clicks "Delete" on a session, **When** the click registers, **Then** an inline confirmation control appears (not a native `window.confirm` dialog), and only clicking the inline "Confirm delete" button actually deletes it.
2. **Given** a student sees the inline confirmation, **When** they click "Cancel" instead, **Then** the session is not deleted and the confirmation closes.

---

### User Story 4 - See when each session was recorded (Priority: P2)

As an authenticated student, I want each recorded session to show when it happened, so I can tell today's session apart from an older one.

**Why this priority**: Lower risk than US1/US2 (no silent failures involved), but still part of the same "always show current, accurate state" trust principle — a list with no dates is ambiguous once it has more than a couple of entries.

**Independent Test**: A student viewing "Recorded sessions" can verify each entry shows a human-readable recorded date/time.

**Acceptance Scenarios**:

1. **Given** a student has one or more recorded sessions, **When** they view the list, **Then** each session shows when it was recorded, in a readable format (not a raw ISO timestamp).

---

### Edge Cases

- What happens if the list is refreshed while a session is mid-edit? Out of scope for this slice — no concurrent-edit conflict handling is introduced here, consistent with how Subjects/Tasks don't handle it either today.
- What happens if the student clicks "Delete" on two different sessions in quick succession? Only one inline confirmation can be open at a time, mirroring `SubjectList.vue`'s existing single-`confirmingDeleteId` behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `StudySessionForm.vue` MUST emit a `created` event carrying the newly created session, immediately after a successful submission — mirroring the existing `SubjectForm.vue`/`TaskForm.vue` pattern.
- **FR-002**: `study-sessions/index.vue` MUST listen for that `created` event and call the session list's exposed `refresh()`, mirroring the existing wiring in `subjects/index.vue` and `tasks/index.vue`.
- **FR-003**: `StudySessionList.vue` MUST expose a `refresh()` method (via `defineExpose`) that reloads the session list, so the page above can call it.
- **FR-004**: `StudySessionList.vue` MUST display the real error message whenever an edit (`saveEdit`) or delete (`removeSession`) request fails, independent of whatever the page-level load `status` currently is.
- **FR-005**: `StudySessionList.vue` MUST replace the native `window.confirm(...)` delete flow with an inline confirm-then-button control (request → confirm/cancel), matching `SubjectList.vue`'s `requestDelete`/`confirmDelete`/`cancelDelete` pattern, including a per-session error slot for a failed delete.
- **FR-006**: `StudySessionList.vue` MUST render each session's `createdAt` in a human-readable format.
- **FR-007**: None of the above may introduce a new Supabase table, column, or API endpoint — every fix wires up client-side state/events that already have an established pattern elsewhere in this codebase (per the parent issue's own framing).

### Key Entities

Not applicable — no data model changes. This spec only changes how already-fetched `StudySession` data (via the existing `GET/POST/PATCH/DELETE /api/study-sessions` endpoints) is wired between components and rendered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful session recordings result in the new session being visible in the list in the same interaction, with no manual reload.
- **SC-002**: 100% of failed edit/delete attempts display the real error message to the student, verified independent of prior page state.
- **SC-003**: 100% of delete attempts go through the inline confirm pattern; a native browser dialog never appears.
- **SC-004**: 100% of sessions in the list display a human-readable recorded date/time.

## Assumptions

- The existing `GET/POST/PATCH/DELETE /api/study-sessions` endpoints and their validation/ownership rules are unchanged and out of scope — this is a client-side wiring and rendering fix only.
- "Human-readable" recorded date/time means using the browser's own locale formatting (`toLocaleString()`/`toLocaleDateString()`), consistent with there being no existing shared date-formatting utility in this codebase to reuse (`TaskList.vue` renders its `dueDate` as the raw `YYYY-MM-DD` string since that field has no time component; `createdAt` here is a full timestamp, so raw ISO would be materially less readable).
- No Vue component-level test infrastructure exists in this codebase (`vitest.config.ts` uses `environment: 'node'`, and no `.vue` file is ever imported by a test) — automated coverage for these four ACs is delivered via Playwright E2E (`tests/e2e/study-sessions.spec.ts`), the same mechanism already used for this page's existing "records a session" scenario, not a new unit-testing layer.
