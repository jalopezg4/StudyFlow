# Feature Specification: Study Session Recording

**Feature Branch**: `feat/HU09-study-session-recording`

**Created**: 2026-08-20

**Status**: Implemented - pending live Supabase validation

**Input**: User Story: As a student, I want to record my study sessions, so that I can track the time I dedicate to studying.

## Clarifications

### Session 2026-08-20

- Q: Should every study session be associated with a subject, with an optional study task, or should it be possible to associate it with exactly one of subject/task? → A: Every session requires a subject; a study task is optional and, when supplied, must belong to that subject and the authenticated student.
- Q: What unit and input shape should study duration use? → A: Duration is a positive whole number of minutes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record a study session (Priority: P1)

As an authenticated student, I want to record the time I spent studying, so that my study activity is persisted and can support future progress reporting.

**Why this priority**: Recording one valid session is the smallest complete slice of value and establishes the data needed by future progress and pattern features.

**Independent Test**: An authenticated student submits valid session information referencing an allowed study resource and receives a successful response; the stored session can be retrieved or verified in persistence with the authenticated student as owner.

**Acceptance Scenarios**:

1. **Given** an authenticated student submits a positive whole duration in minutes and an owned subject, **When** the request is processed, **Then** one study session is stored successfully and returned in the success response.
2. **Given** a valid session is created, **When** its persisted ownership is inspected, **Then** its owner is the authenticated student and never a client-supplied student identifier.

---

### User Story 2 - Reject invalid session duration (Priority: P1)

As the system, I need to reject invalid study duration values, so that activity records remain meaningful and usable for later reporting.

**Why this priority**: A non-positive or malformed duration would corrupt the core metric this feature exists to collect.

**Independent Test**: An authenticated student submits zero, negative, missing, malformed, or otherwise invalid duration values and receives a validation error; no session is persisted.

**Acceptance Scenarios**:

1. **Given** an authenticated student submits a duration that is zero or negative, **When** the request is processed, **Then** it is rejected with a validation error and no session is stored.
2. **Given** an authenticated student submits a malformed or missing duration, **When** the request is processed, **Then** it is rejected with a validation error and no session is stored.

---

### User Story 3 - Enforce resource ownership (Priority: P1)

As the system, I need to verify the student's ownership of the referenced study resource, so that one student cannot record activity against another student's subject or task.

**Why this priority**: Ownership isolation is a non-negotiable security property for every user-owned StudyFlow resource.

**Independent Test**: Two authenticated students have separate resources; one student attempts to create a session using the other student's resource and receives a denial without any persisted session.

**Acceptance Scenarios**:

1. **Given** the referenced subject or optional task belongs to another student, **When** the authenticated student submits a session, **Then** the request is denied and no session is persisted.
2. **Given** an unauthenticated request attempts to create a session, **When** the request is processed, **Then** it is rejected before validation-dependent persistence and no session is stored.

## Edge Cases

- What happens when the authenticated session expires between opening the form and submitting the session? The request is rejected as unauthenticated and no data is written.
- What happens when a referenced resource id is well-formed but does not exist or is not owned by the requester? The request fails with the same safe not-found/denial behavior and does not reveal another student's resource.
- What happens when the request includes a client-supplied `userId`, `ownerId`, or equivalent? It is ignored or rejected; ownership is always derived from the authenticated session.
- What happens when a task belongs to a different subject than the supplied subject? The request is rejected to prevent inconsistent associations.
- What happens when the duration is an extremely large value? It is rejected when it exceeds the domain maximum of 1,440 minutes (24 hours).
- What happens when persistence fails? The response uses the existing safe error envelope and does not expose database details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated student to create a study session with a positive whole duration in minutes and an owned subject, with an optional owned study task.
- **FR-002**: The system MUST persist each study session with ownership derived exclusively from the authenticated session.
- **FR-003**: The system MUST reject missing, malformed, zero, negative, non-whole, and over-limit duration values before persistence.
- **FR-004**: The system MUST require an owned subject and, when a task is supplied, verify that the task belongs to both the authenticated student and the supplied subject before persistence.
- **FR-005**: The system MUST reject attempts to reference a subject or study task not owned by the authenticated student.
- **FR-006**: The system MUST reject unauthenticated session-creation requests before any session is persisted.
- **FR-007**: The system MUST protect persisted study sessions with the same server-side authorization conventions and Supabase RLS ownership guarantees used by subjects and study tasks.
- **FR-008**: The system MUST validate all untrusted session input before business logic and persistence.
- **FR-009**: The system MUST return a safe, predictable success response for valid creation and a safe error envelope for rejected or failed requests.
- **FR-010**: The system MUST NOT allow client input to set or override the session owner, creation timestamp, or other server-controlled ownership fields.

### Key Entities

- **Study Session**: A persisted record of one student's study activity, including a positive whole duration in minutes, server-derived owner, creation timestamp, required subject, and optional study task.
- **Subject**: An existing user-owned study area that may contextualize a session.
- **Study Task**: An existing user-owned task that may contextualize a session; each task already belongs to a subject.
- **Authenticated Student**: The server-resolved identity that owns the session and controls which referenced resources are valid.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid authenticated creation scenarios persist exactly one session with the authenticated student as owner.
- **SC-002**: 100% of invalid duration scenarios are rejected before persistence, including zero, negative, missing, and malformed values.
- **SC-003**: 100% of cross-student resource-reference attempts are denied without creating a session or exposing the other student's data.
- **SC-004**: 100% of unauthenticated creation attempts are rejected before persistence.
- **SC-005**: Every persisted session contains a positive whole duration from 1 through 1,440 minutes, an owned subject, and either no task or a task owned by the same student under that subject.

## Assumptions

- The existing Supabase Auth identity, server authentication middleware, request-scoped Supabase client, security helpers, and ownership/RLS conventions are reused unchanged.
- The feature adds a new persisted study-session entity and does not alter the existing subject or study-task entity shape unless the final association rule requires a foreign-key adjustment.
- Session creation is the initial scope; listing, editing, deleting, timers, progress charts, and aggregate reporting remain out of scope unless separately specified.
- The database is the source of truth; the client does not retain sessions only in memory.
- Duration is stored and exchanged as whole minutes, with an inclusive domain range of 1 through 1,440 minutes.
- Every session requires a subject; the task association is optional but must be consistent with the selected subject and authenticated owner.
