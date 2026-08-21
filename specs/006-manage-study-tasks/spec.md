# Feature Specification: Manage Study Tasks

**Feature Branch**: `006-manage-study-tasks`

**Created**: 2026-08-20

**Status**: Implemented

**Input**: User description: "HU06 - Manage Study Tasks

As a student, I want to view, edit (including marking a task complete/pending), and delete my study tasks, so that I can keep my pending academic work accurate and up to date. Depends on HU05 (create study task)."

## Clarifications

### Session 2026-08-20

- Q: Can two study tasks belonging to the same student, even under the same subject, share the identical title? → A: Yes. Duplicate titles are allowed; tasks are distinguished by their identity (`id`), not by uniqueness of title — the same convention already established for subject names in HU03. A student may reasonably want two tasks with the same title (e.g., a recurring weekly reading, or logging the same kind of work twice).
- Q: Does the base listing for this feature need to support filtering or sorting by subject, due date, or status? → A: No. This feature delivers the simplest useful listing (all of the student's own tasks). Filtering and sorting are HU07's dedicated scope, layered on top of this listing without changing it.
- Q: Is there a dependency rule blocking deletion of a task, similar to how HU04 blocks deleting a subject with tasks? → A: No. No entity currently references a study task (HU09's study sessions do not exist yet), so deletion proceeds unconditionally once ownership is confirmed — the same interim reasoning HU04 used for subjects before tasks existed.

### Session 2026-08-20 (amendment, after initial implementation)

- Q: Should deleting a subject with associated study tasks remain blocked (HU04's original rule), or should it cascade to delete those tasks? → A: Cascade, with an explicit warning. This better matches how task-management tools in this niche behave (deleting a project/list removes its items) and avoids students getting stuck unable to delete a subject without first manually deleting every task under it one by one. To protect against accidental data loss, the client MUST show the student how many tasks will be deleted before they confirm (see FR-013), rather than cascading silently. This reverses HU04's FR-010/FR-011 (`specs/005-manage-subjects/spec.md`) and HU05's data-model assumption that the `study_tasks.subject_id` foreign key has no cascade (`specs/005-create-study-task/data-model.md`) — both are amended alongside this change.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View my own study tasks (Priority: P1)

As an authenticated student, I want to open my task list and see only the tasks I own, so that I can review my current academic workload without seeing anyone else's data.

**Why this priority**: Viewing is the entry point for editing and deleting alike, and is the simplest way to prove per-student data isolation end-to-end for this entity — the same role HU04's "View my own subjects" story played for subjects.

**Independent Test**: An authenticated student with existing tasks can request their task listing and verify every task shown belongs to them, while a second student's tasks (created independently, possibly under a different subject) never appear in the first student's listing.

**Acceptance Scenarios**:

1. **Given** the student has study tasks registered, **When** they request their task listing, **Then** they see only their own tasks, across all of their subjects.
2. **Given** two students each own at least one study task, **When** either student requests their task listing, **Then** the response contains exclusively the requesting student's tasks and none belonging to the other student.
3. **Given** the student has no study tasks yet, **When** they request their task listing, **Then** the response is a valid empty result, not an error.

---

### User Story 2 - Edit my own study task (Priority: P1)

As an authenticated student, I want to update the title, description, and/or due date of a task I own, and to mark it as completed or pending, so that I can keep my task list accurate as my work progresses.

**Why this priority**: Editing (including status changes) is the core value of this feature — a task list that only ever grows and never reflects progress has little use. Independently valuable once viewing exists.

**Independent Test**: An authenticated student who owns a task can submit a valid partial update (any combination of title, description, due date, status) and verify the change is persisted and reflected back, without needing deletion to be implemented.

**Acceptance Scenarios**:

1. **Given** a task belongs to the authenticated student, **When** they update its title with a valid value, **Then** the system saves the change and reflects the new title.
2. **Given** a task belongs to the authenticated student, **When** they update its description and/or due date with valid values, **Then** the system saves the changes and reflects them.
3. **Given** a pending task belongs to the authenticated student, **When** they mark it as completed, **Then** the system saves the new status and reflects it; the reverse (completed → pending) is equally supported.
4. **Given** a task belongs to the authenticated student, **When** they submit an update with an empty title, a whitespace-only title, a title over the maximum length, a description over the maximum length, an invalid due date, or an invalid status value, **Then** the system rejects the operation, reports a validation error, and leaves the stored task unchanged.
5. **Given** a task belongs to the authenticated student, **When** they submit an update body with none of title/description/dueDate/status present, **Then** the system rejects the operation as a validation error.

---

### User Story 3 - Be blocked from touching another student's study task (Priority: P1)

As the system, I need to deny any attempt by one student to view details of, edit, or delete a study task owned by a different student, so that ownership and data isolation guarantees hold for every operation in this spec.

**Why this priority**: This is the security guarantee that makes viewing, editing, and deleting trustworthy — the same role HU04's User Story 3 played for subjects.

**Independent Test**: With two students each owning a task, Student B can attempt to view, edit, or delete Student A's task by id and the attempt can be verified to be denied by the server with zero changes to Student A's data, independent of the UI.

**Acceptance Scenarios**:

1. **Given** a task belongs to Student A, **When** Student B attempts to view it directly by id, **Then** the server denies the operation without revealing whether a task with that id exists.
2. **Given** a task belongs to Student A, **When** Student B attempts to edit it (including a status change), **Then** the server denies the operation and does not modify the task.
3. **Given** a task belongs to Student A, **When** Student B attempts to delete it, **Then** the server denies the operation and the task remains in Student A's listing, unchanged.
4. **Given** a task id does not exist at all, **When** any student attempts to view, edit, or delete it, **Then** the server denies the operation identically to the cross-ownership cases above, without distinguishing "not found" from "not yours."

---

### User Story 4 - Delete a study task I no longer need (Priority: P2)

As an authenticated student, I want to delete a task I own, so that I can remove work that is no longer relevant to my academic organization.

**Why this priority**: Deletion is destructive and sequenced after viewing, editing, and the ownership guarantee are in place, mirroring HU04's prioritization for subjects.

**Independent Test**: An authenticated student who owns a task can confirm its deletion and verify it is removed from persistence and no longer appears in their listing, without depending on the edit flow being exercised first.

**Acceptance Scenarios**:

1. **Given** the student is the owner of a task, **When** they confirm its deletion, **Then** the system deletes the task and it no longer appears in their listing.
2. **Given** the student attempts to delete a task id that does not exist (or was already deleted), **When** the request is processed, **Then** the system denies the operation the same way it denies access to another student's task, without implying data corruption.

---

### Edge Cases

- What happens when a student creates two tasks with the identical title, even under the same subject? Both are created and persisted as distinct tasks; title uniqueness is not enforced (see Clarifications).
- What happens when a student submits an edit with only one field (e.g., only `status`)? The system must apply a partial update, leaving every other field as-is.
- What happens when an edit trims a title down to whitespace-only? The system must trim before validating and reject it the same way task creation does.
- What happens when a student submits `status` with a value other than `pending`/`completed`? The system must reject the request as a validation error.
- What happens when a student attempts to edit or delete a task id that does not exist at all (never owned by anyone)? The system must deny the operation the same way it denies access to another student's task, without distinguishing "not found" from "not yours."
- What happens when a student's session expires between opening the edit/delete UI and submitting the request? The attempt must be treated as unauthenticated and rejected before any data is read or changed.
- What happens when a student attempts to delete the same task twice in quick succession (e.g., a double click)? The second attempt must find no matching owned task left to delete and must not error the client-visible flow in a way that implies data corruption.
- What happens when a student marks a task as `completed` and then edits its title in a separate request? The status is untouched by an update that does not include a `status` field; each field updates independently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated student to retrieve a listing of study tasks containing exclusively the tasks owned by that student, across all of their subjects.
- **FR-002**: The system MUST allow an authenticated student to retrieve a single study task by id, returning it only when owned by that student.
- **FR-003**: The system MUST NOT include any other student's tasks in a listing, detail view, or query result returned to a requesting student.
- **FR-004**: The system MUST allow the owning authenticated student to update the title, description, due date, and/or status of a task they own, supporting a partial update of any subset of these fields independently.
- **FR-005**: The system MUST validate an update's title (optional; when present, 1-100 characters after trimming, same convention as task creation), description (optional; when present, up to 500 characters), due date (optional; when present, a valid date), and status (optional; when present, one of `pending`/`completed`), and MUST require that at least one of these four fields be present in the update; an update that fails validation MUST be rejected before any change is persisted, leaving the existing stored data unchanged.
- **FR-006**: The system MUST persist a successful update immediately and make the updated task available to the client in the same request/response cycle.
- **FR-007**: The system MUST deny any attempt to view, update, or delete a task that the requesting authenticated student does not own, regardless of how the target task's identifier was obtained or supplied.
- **FR-008**: When denying a cross-ownership or nonexistent-task request, the system MUST NOT alter any data and MUST NOT reveal whether a task with the requested identifier exists under a different owner.
- **FR-009**: The system MUST reject any listing, detail-view, update, or delete request made without a valid authenticated session, before any protected data is read or changed.
- **FR-010**: The system MUST derive task ownership for detail-view, update, and delete operations solely from the authenticated session, never from a client-supplied owner or user identifier.
- **FR-011**: The system MUST allow the owning authenticated student to delete a task they own; no dependency rule blocks this deletion today (see Clarifications).
- **FR-012**: Upon successful deletion, the system MUST remove the task from persistence such that it no longer appears in the owning student's subsequent listings.
- **FR-013** *(amendment)*: The system MUST report, for each of a student's own subjects, the count of study tasks currently associated with it, so the client can warn the student how many tasks will be deleted before they confirm deleting that subject. Deleting a subject MUST delete its associated study tasks as well (cascade), and MUST NOT be blocked merely because associated tasks exist.

### Key Entities *(include if feature involves data)*

- **Study Task** (unchanged shape from HU05, extended access rules): title (1-100 characters after trimming), description (optional, up to 500 characters), due date (optional), status (`pending`/`completed`), owning student, owning subject. This spec adds view/edit/delete access rules on top of the creation rules HU05 already established; no new fields are introduced.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across test scenarios involving two or more students, 100% of task listing and detail-view requests return exclusively the requesting student's own tasks.
- **SC-002**: An authenticated student can update a task's title, description, due date, and/or status and see the change reflected within a single interaction, with no manual refresh required.
- **SC-003**: 100% of view, edit, or delete attempts targeting a task the requesting student does not own are denied by the server and result in zero changes to that task's stored data.
- **SC-004**: A task deleted by its owner no longer appears in that student's listing in the same session, with no manual refresh required.
- **SC-005**: 100% of update attempts with invalid field values are rejected, with zero changes persisted and a validation error identifying the problem.
- **SC-006** *(amendment)*: A student attempting to delete a subject that has associated study tasks always sees an accurate count of how many tasks will also be deleted before the deletion is confirmed, and 100% of confirmed subject deletions leave zero orphaned study tasks behind (they are deleted along with the subject).

## Assumptions

- "Authenticated student" and server-derived ownership follow the same session and authorization model established by HU01 (authentication) and HU05 (create study task); this spec does not redefine either.
- The title/description validation limits (1-100 characters for title, up to 500 for description) reuse the limits already established in HU05, and the same convention already established for subjects (HU03/HU04).
- Filtering and sorting the task listing (by subject, due date, status, etc.) are explicitly out of scope for this feature; HU07 (Filter and Sort Study Tasks) delivers that on top of the listing this feature provides.
- Task recommendation (HU08), study-session tracking (HU09), and dashboard reporting (HU10) are out of scope for this feature.
- Deletion of a study task is unconditional today because no entity currently references one; if a future feature (e.g., HU09 study sessions) introduces such a reference, that feature is responsible for defining its own dependency rule, the same way HU05 introduced the dependency rule that now applies to subject deletion.
- *(amendment)* Subject deletion cascading to study tasks (FR-013) reverses HU04's original blocking rule. This was a deliberate product decision, not a bug fix — see the second Clarifications session above. `specs/005-manage-subjects/spec.md` and `specs/005-create-study-task/data-model.md` carry pointer notes to this amendment rather than being silently rewritten, preserving the historical record of what each feature originally shipped.
