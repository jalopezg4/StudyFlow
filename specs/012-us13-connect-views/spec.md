# Feature Specification: US13 Connect Views Instead of Making Students Hunt

**Feature Branch**: `feat/HU13-us13-speckit-redo`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "US13 with assigned implementation scope AC04 and AC05 only, keeping AC01-AC03 untouched in this branch."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View tasks from each subject row (Priority: P1)

As a student, I want to open tasks directly from a subject row, so I can stay on the Subjects page and avoid manual re-filtering.

**Why this priority**: This removes immediate navigation friction and reveals data relationships the app already knows.

**Independent Test**: From Subjects page, open a subject row and verify the row shows only tasks for that subject with proper states.

**Acceptance Scenarios**:

1. **Given** I am on the Subjects page, **When** I click View tasks on a subject, **Then** I see that subject tasks inline under the same row.
2. **Given** a subject has no tasks, **When** I expand it, **Then** I see an empty-state message for that subject.
3. **Given** the inline fetch fails, **When** I expand a subject, **Then** I see an error with retry action.

---

### User Story 2 - Act on recommendation without leaving dashboard (Priority: P1)

As a student, I want to mark the recommended task complete from the card itself, so I can progress without context switching.

**Why this priority**: The recommendation is visible but low-value if not actionable.

**Independent Test**: On dashboard, mark recommended task complete and verify card refreshes with next recommendation or empty state.

**Acceptance Scenarios**:

1. **Given** a pending recommended task exists, **When** I click Mark complete, **Then** its status is updated and the recommendation refreshes.
2. **Given** no pending tasks remain after completion, **When** the card refreshes, **Then** I see the caught-up empty state.

---

### User Story 3 - Understand why this task is recommended (Priority: P2)

As a student, I want a short explanation on the recommendation card, so I understand recommendation logic and trust it.

**Why this priority**: Explanation improves clarity and confidence without backend changes.

**Independent Test**: Verify explanation message changes based on task due date presence.

**Acceptance Scenarios**:

1. **Given** recommended task has due date, **When** card renders, **Then** reason states earliest due pending task.
2. **Given** recommended task has no due date, **When** card renders, **Then** reason states oldest pending task without due date.

---

### Edge Cases

- Expanding one subject then another should update which inline panel is visible and load data for the selected subject.
- Deleting an expanded subject should not leave stale inline task panel state behind.
- Mark complete action must handle API failure and keep user feedback visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a View tasks and Hide tasks toggle per subject row.
- **FR-002**: System MUST fetch subject-inline tasks using existing `GET /api/tasks?subjectId=...`.
- **FR-003**: System MUST render loading, error, retry, and empty states for subject-inline tasks.
- **FR-004**: System MUST provide Mark complete on recommended task card using existing `PATCH /api/tasks/:id`.
- **FR-005**: System MUST refresh recommendation after successful task completion using existing `GET /api/tasks/recommendation`.
- **FR-006**: System MUST render recommendation reason from returned task data: due-date case and no-due-date case.
- **FR-007**: This branch MUST NOT modify AC01, AC02, AC03 implementation scope.
- **FR-008**: This branch MUST NOT introduce new endpoints, schema changes, or migrations.

### Key Entities *(include if feature involves data)*

- **Subject**: Existing subject projection used in SubjectList with id, name, description, taskCount.
- **StudyTask**: Existing task projection used in task list and recommendation card with id, subjectId, title, dueDate, status, createdAt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can open subject-inline tasks in one click from Subjects page without route change.
- **SC-002**: A student can complete recommended task directly from dashboard recommendation card.
- **SC-003**: Recommendation card always displays one explicit reason string for why task was chosen.
- **SC-004**: CI Validate passes with no new lint or typecheck errors from this feature.

## Assumptions

- Existing ownership and authorization behavior in tasks endpoints is unchanged and reused.
- Recommendation ordering remains backend-defined by due date, then created date, then id.
- Existing pre-feature warning in PasswordInput is outside this branch scope.
