# Feature Specification: Study Progress Dashboard

**Feature Branch**: `feat/HU10-progress-dashboard`

**Created**: 2026-08-21

**Status**: Implemented - pending live Supabase validation

**Input**: User Story: As a student, I want to view a dashboard of my study progress, so that I can understand my completed work and study activity.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View my progress summary (Priority: P1)

As an authenticated student, I want to see a consolidated summary of my tasks and study time, so that I can understand my current progress without visiting multiple pages.

**Why this priority**: A single progress view is the main value of this HU and the final product workflow depends on it.

**Independent Test**: An authenticated student with tasks and study sessions opens the dashboard and sees metrics calculated from only that student's records.

**Acceptance Scenarios**:

1. **Given** an authenticated student has tasks and recorded sessions, **When** they open the dashboard, **Then** the dashboard displays total tasks, completed tasks, pending tasks, completion percentage, recorded session count, and total study minutes.
2. **Given** an authenticated student has tasks in different states, **When** progress is calculated, **Then** completed and pending counts match the student's stored task statuses and the completion percentage is calculated consistently.
3. **Given** an authenticated student has recorded sessions, **When** the dashboard is loaded, **Then** total study minutes equals the sum of that student's valid session durations and the session count equals that student's recorded sessions.

---

### User Story 2 - See a valid empty state (Priority: P1)

As an authenticated student with no study activity, I want the dashboard to show a clear empty state, so that an empty account feels valid rather than broken.

**Why this priority**: New students are expected to have no tasks or sessions, and this state must work without special setup.

**Independent Test**: An authenticated student with no tasks and no sessions opens the dashboard and receives zero-valued metrics plus an explanatory empty state without an error.

**Acceptance Scenarios**:

1. **Given** an authenticated student has no tasks and no sessions, **When** they open the dashboard, **Then** the dashboard displays zero metrics and an appropriate empty-state message.
2. **Given** an authenticated student has tasks but no recorded sessions, **When** they open the dashboard, **Then** task metrics remain accurate, study minutes and session count are zero, and the dashboard does not fail.

---

### User Story 3 - Preserve data isolation (Priority: P1)

As the system, I need dashboard metrics to use only the requesting student's data, so that progress from different students can never be combined or exposed.

**Why this priority**: Data isolation is a mandatory security property for all StudyFlow user-owned data.

**Independent Test**: Two students with different tasks and sessions open the dashboard and each receives metrics calculated exclusively from their own records; an unauthenticated request is rejected before data access.

**Acceptance Scenarios**:

1. **Given** Student A and Student B have different tasks and sessions, **When** Student A opens the dashboard, **Then** no value from Student B contributes to Student A's metrics.
2. **Given** an unauthenticated visitor requests dashboard progress directly, **When** the request is processed, **Then** it is rejected with the existing unauthenticated response and no dashboard data is returned.

## Edge Cases

- What happens when all tasks are completed? Pending count is zero and completion percentage is 100% when at least one task exists.
- What happens when there are no tasks? Total, completed, and pending counts are zero and completion percentage is 0%, not an undefined value.
- What happens when sessions exist without tasks? Session count and total minutes still include valid sessions because sessions may be subject-only.
- What happens when the user has tasks but no sessions? Task metrics are returned and study-time metrics are zero.
- What happens when stored session duration is invalid? Database constraints prevent invalid persisted sessions; the dashboard only aggregates valid persisted records.
- What happens when one aggregate query fails? The API returns a safe error response rather than partial or misleading metrics.
- What happens when the session expires while the dashboard is open? The next dashboard request is rejected as unauthenticated and stale metrics are not treated as current.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated student to request a consolidated progress summary.
- **FR-002**: The summary MUST include total task count, completed task count, pending task count, and task completion percentage.
- **FR-003**: The summary MUST include recorded study-session count and total study duration in minutes.
- **FR-004**: Completed-task count MUST include only tasks whose stored status is exactly `completed`.
- **FR-005**: Pending-task count MUST include only tasks whose stored status is exactly `pending`.
- **FR-006**: Task completion percentage MUST be 0 when there are no tasks; otherwise it MUST equal completed tasks divided by total tasks multiplied by 100, rounded to the nearest whole percent.
- **FR-007**: Total study minutes MUST equal the sum of valid persisted `duration_minutes` values belonging to the authenticated student.
- **FR-008**: The summary MUST be scoped to the authenticated student's server-derived identity for every metric.
- **FR-009**: The system MUST reject unauthenticated dashboard-summary requests before returning data.
- **FR-010**: The system MUST return zero-valued metrics and a valid empty-state indicator when the student has no tasks or sessions.
- **FR-011**: The summary operation MUST be read-only and MUST NOT create, update, or delete tasks or sessions.
- **FR-012**: The API MUST return a safe error envelope when progress aggregation fails and MUST NOT expose database details.

### Key Entities

- **Progress Summary**: A read-only calculated view containing task counts, completion percentage, session count, total study minutes, and an empty-state indicator.
- **Study Task**: Existing user-owned task data contributing status counts.
- **Study Session**: Existing user-owned session data contributing session count and total minutes.
- **Authenticated Student**: The server-resolved owner used to scope every aggregate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of authenticated dashboard requests return task metrics matching the requesting student's stored task statuses.
- **SC-002**: 100% of authenticated dashboard requests return study minutes and session count matching the requesting student's stored sessions.
- **SC-003**: Across two-user scenarios, 100% of dashboard responses contain metrics derived exclusively from the requesting student.
- **SC-004**: 100% of empty-account dashboard requests return a successful zero-valued summary rather than an error.
- **SC-005**: A student can understand task completion and recorded study time from one authenticated dashboard view without manually combining data from separate pages.

## Assumptions

- The existing authenticated session middleware, request-scoped Supabase client, safe errors, and RLS conventions are reused.
- No new database table is required; the summary is calculated from `study_tasks` and `study_sessions`.
- The initial dashboard exposes aggregate metrics only; charts, date-range filters, streaks, trends, export, and recommendations remain out of scope.
- The dashboard page already exists as a protected route and will be upgraded from its placeholder content.
- The API returns a stable summary envelope with zero values for empty datasets.
