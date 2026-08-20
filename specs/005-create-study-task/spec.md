# Feature Specification: Create Study Task

**Feature Branch**: `005-create-study-task`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "HU05 - Create Study Task

As a student, I want to create a study task linked to one of my subjects, so that I can keep track of the work I need to do for that subject."

## Clarifications

### Session 2026-08-19

- Q: Should a study task support an optional due date in this first version? → A: Yes, optional. The student may set a due date when creating the task, but it is not required.
- Q: Should a study task have a pending/completed status from this feature onward? → A: Yes. A newly created task always starts as `pending`; marking it `completed` is an editing capability delivered by HU06 (Manage Study Tasks).
- Q: Should deleting a subject's tasks or the task itself be restricted by any other entity? → A: Not applicable to this feature (task creation only); the deletion rule is scoped to HU06.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a task for one of my subjects (Priority: P1)

As an authenticated student, I want to create a study task under a subject I own, specifying a title and optionally a description and a due date, so that I can register work I still need to do for that subject.

**Why this priority**: This is the entry point for all future task-related stories (HU06 manage, HU07 filter/sort, HU08 recommendation, HU09 sessions, HU10 dashboard) — without the ability to create a task, none of them have anything to operate on.

**Independent Test**: An authenticated student who owns at least one subject can submit a valid title (and optionally a description and due date) for that subject and verify a new task is created, owned by them, linked to the correct subject, starts with `pending` status, and is immediately retrievable — delivering standalone value (a persisted, trackable task) without depending on any other unfinished feature.

**Acceptance Scenarios**:

1. **Given** the student owns a subject, **When** they submit a valid title for a new task under that subject, **Then** the system creates the task, links it to the subject, sets its status to `pending`, and returns the created task.
2. **Given** the student owns a subject, **When** they submit a title together with a description and a due date, **Then** the system creates the task with all three values stored and reflected in the response.
3. **Given** the student owns a subject, **When** they submit only a title (no description, no due date), **Then** the system creates the task with the optional fields left empty, without error.

---

### User Story 2 - Be blocked from creating a task under another student's subject (Priority: P1)

As the system, I need to deny any attempt by a student to create a task under a subject owned by a different student, so that ownership and data isolation guarantees hold from the moment a task is created.

**Why this priority**: Without this guarantee, task creation could be used to write data against another student's academic organization, undermining the isolation already established for subjects (HU03/HU04).

**Independent Test**: With two students where Student A owns a subject, Student B can attempt to create a task under that subject id and the attempt can be verified to be denied by the server, with no task created, independent of the UI.

**Acceptance Scenarios**:

1. **Given** a subject belongs to Student A, **When** Student B attempts to create a task under that subject id, **Then** the server denies the operation, creates no task, and does not reveal whether a subject with that identifier exists under a different owner.
2. **Given** a subject id does not exist at all, **When** any student attempts to create a task under it, **Then** the server denies the operation the same way it denies a cross-ownership attempt, without distinguishing "not found" from "not yours" in the response.

---

### User Story 3 - Reject invalid task data (Priority: P2)

As an authenticated student, when I submit invalid data for a new task, I want the system to reject it and tell me what is wrong, so that my task list only ever contains valid, usable entries.

**Why this priority**: Data quality matters for the value of later stories (filtering, sorting, recommendation, dashboard), but is lower priority than the core creation flow and the ownership guarantee, since it only affects the error path.

**Independent Test**: An authenticated student who owns a subject can submit a title that violates the length rule, or a due date in an invalid format, and verify the request is rejected with no task created.

**Acceptance Scenarios**:

1. **Given** the student owns a subject, **When** they submit an empty title or a whitespace-only title, **Then** the system rejects the request, reports a validation error, and creates no task.
2. **Given** the student owns a subject, **When** they submit a title longer than 100 characters (after trimming) or a description longer than 500 characters, **Then** the system rejects the request, reports a validation error, and creates no task.
3. **Given** the student owns a subject, **When** they submit a due date that is not a valid date, **Then** the system rejects the request, reports a validation error, and creates no task.

---

### Edge Cases

- What happens when the student's session expires between opening the task creation form and submitting it? The attempt must be treated as unauthenticated and rejected before any data is read or written.
- What happens when the student submits a title padded with leading/trailing whitespace? The system must trim it before validating and storing, consistent with the subject-name convention from HU03.
- What happens when the student omits the subject id entirely? The system must reject the request as a validation error, since a task cannot exist without an owning subject.
- What happens when the due date is provided but is a date far in the past? No restriction is imposed; any syntactically valid date is accepted, since the student may be logging catch-up work.
- What happens when the request includes a client-supplied owner or user identifier? The system must ignore it and derive ownership solely from the authenticated session, the same rule already established for subjects.
- What happens when the due date field is submitted as an empty string rather than omitted entirely? The system must treat it as "no due date" rather than as a validation failure, the same convention already established for the optional subject description.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated student to create a study task under a subject they own, supplying at least a title.
- **FR-002**: The system MUST require the task title to be present and non-empty after trimming whitespace; requests with an empty or whitespace-only title MUST be rejected with a validation error.
- **FR-003**: The system MUST enforce a maximum task title length of 100 characters after trimming, matching the length convention already established for subject names; requests exceeding this length MUST be rejected with a validation error.
- **FR-004**: The system MUST treat the task description as optional; requests omitting a description or supplying an empty description MUST succeed.
- **FR-005**: The system MUST enforce a maximum task description length of 500 characters when supplied, matching the convention already established for subject descriptions; requests exceeding this length MUST be rejected with a validation error.
- **FR-006**: The system MUST treat the due date as optional and MUST reject a supplied value that is not a valid date.
- **FR-007**: The system MUST set a newly created task's status to `pending` and MUST NOT allow the client to set any other initial status.
- **FR-008**: The system MUST deny task creation when the referenced subject does not belong to the requesting authenticated student, and MUST NOT reveal whether the subject id exists under a different owner.
- **FR-009**: The system MUST derive the task owner solely from the authenticated session, never from a client-supplied user identifier.
- **FR-010**: The system MUST reject any task creation request made without a valid authenticated session, before any data is read or written.
- **FR-011**: The system MUST reject a task creation request that fails validation (FR-002, FR-003, FR-004, FR-005, FR-006, or a missing/invalid subject reference) without creating any task or partially persisting data.
- **FR-012**: The system MUST persist a successfully created task immediately and make it immediately retrievable by the owning student in the same request/response cycle, even though the full task-listing experience is delivered separately by HU06.

### Key Entities *(include if feature involves data)*

- **Study Task**: Represents a unit of work a student wants to complete for one of their subjects. Attributes: title (1-100 characters after trimming), description (optional, up to 500 characters), due date (optional), status (`pending` or `completed`, always `pending` on creation), owning student, and the subject it belongs to. A task always belongs to exactly one subject owned by the same student who owns the task.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authenticated student can create a study task under one of their subjects in a single interaction, with the new task immediately visible and retrievable, with no manual refresh or additional step required.
- **SC-002**: Across test scenarios involving two or more students, 100% of attempts to create a task under a subject the requester does not own are denied, with zero tasks created.
- **SC-003**: 100% of task creation attempts with an invalid title, description, or due date are rejected, with zero tasks created and a validation error identifying the problem.
- **SC-004**: 100% of task creation attempts made without a valid authenticated session are rejected before any data is read or written.
- **SC-005**: 100% of tasks stored in the system have a non-null owning student and a non-null subject reference that both match the authenticated identity and the requested subject at creation time, verified independently of any client-supplied input.

## Assumptions

- "Authenticated student" and server-derived ownership follow the same session and authorization model already established by HU01 (authentication) and HU03/HU04 (subjects); this spec does not redefine either.
- The title/description validation limits (1-100 characters for title, up to 500 for description) reuse the limits already established for subjects, for consistency across the app.
- Editing a task (including marking it `completed`) and deleting a task are out of scope for this feature; they are delivered by HU06 (Manage Study Tasks), which depends on this feature.
- Filtering, sorting, recommendation, study-session tracking, and dashboard reporting on tasks (HU07-HU10) are out of scope for this feature.
- A task must always reference an existing subject owned by the same student; there is no concept of a task without a subject in this product.
