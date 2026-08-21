# Feature Specification: Manage Existing Subjects

**Feature Branch**: `005-manage-subjects`

**Created**: 2026-08-18

**Status**: Implemented

> **Amended by HU06 (2026-08-20)**: FR-010/FR-011 and User Story 4 AC2 below described *blocking* deletion of a subject with associated study tasks. That rule was reversed by `specs/006-manage-study-tasks/spec.md` (FR-013): deletion now cascades to associated tasks, with the client required to show the student a task count before they confirm. The text below is left as originally written to preserve the historical record of what HU04 shipped; the cascade behavior is the current, effective rule.

**Input**: User description: "HU04 - Consultar, editar y eliminar materias

Como estudiante, quiero consultar, editar y eliminar mis materias, para mantener actualizada mi organización académica.

Reglas de negocio:
1. El estudiante solo puede visualizar sus propias materias.
2. Solo el propietario puede modificar o eliminar una materia.
3. La estrategia para eliminar materias con tareas asociadas debe quedar definida en la spec (recomendado: bloquear eliminación mientras existan tareas asociadas o usar eliminación controlada).

Criterios de aceptación:
- CA01: el estudiante tiene materias registradas, abre la sección de materias, visualiza únicamente sus propias materias.
- CA02: una materia pertenece al estudiante autenticado, modifica su nombre o descripción con valores válidos, el sistema guarda los cambios y refleja los nuevos datos en la interfaz.
- CA03: una materia pertenece al Usuario A, el Usuario B intenta editarla o eliminarla, el servidor deniega la operación y no modifica la información.
- CA04: el estudiante es propietario de una materia eliminable, confirma la eliminación, el sistema elimina la materia y deja de mostrarla en su listado.

Dependencies: HU03 (subject creation)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View my own subjects (Priority: P1)

As an authenticated student, I want to open the subjects section and see only the subjects I own, so that I can review my current academic organization without seeing anyone else's data.

**Why this priority**: Viewing is the entry point for every other capability in this spec (editing and deleting both start from the listing) and is the simplest way to prove per-student data isolation end-to-end.

**Independent Test**: An authenticated student with existing subjects can open the subjects section and verify that every subject shown belongs to them, while a second student's subjects (created independently) never appear in the first student's listing.

**Acceptance Scenarios**:

1. **Given** the student has subjects registered, **When** they open the subjects section, **Then** they see only their own subjects.
2. **Given** two students each own at least one subject, **When** either student requests their subject listing, **Then** the response contains exclusively the requesting student's subjects and none belonging to the other student.

---

### User Story 2 - Edit my own subject (Priority: P1)

As an authenticated student, I want to update the name and/or description of a subject I own, so that I can keep my academic organization accurate as things change.

**Why this priority**: Editing is the core value proposition of this user story (keeping data current) and is independently valuable once viewing exists.

**Independent Test**: An authenticated student who owns a subject can submit a valid new name and/or description for it and verify the change is persisted and reflected back without needing deletion to be implemented.

**Acceptance Scenarios**:

1. **Given** a subject belongs to the authenticated student, **When** they modify its name with a valid value, **Then** the system saves the change and reflects the new name in the interface.
2. **Given** a subject belongs to the authenticated student, **When** they modify its description with a valid value, **Then** the system saves the change and reflects the new description in the interface.
3. **Given** a subject belongs to the authenticated student, **When** they submit an update with an empty name, a whitespace-only name, a name over the maximum length, or a description over the maximum length, **Then** the system rejects the operation, reports a validation error, and leaves the stored subject unchanged.

---

### User Story 3 - Be blocked from touching another student's subject (Priority: P1)

As the system, I need to deny any attempt by one student to view details of, edit, or delete a subject owned by a different student, so that ownership and data isolation guarantees hold for every operation in this spec.

**Why this priority**: This is the security guarantee that makes viewing, editing, and deleting trustworthy; without it, any of the other user stories could leak or corrupt another student's data.

**Independent Test**: With two students each owning a subject, Student B can attempt to edit or delete Student A's subject by id and the attempt can be verified to be denied by the server with zero changes to Student A's data, independent of the UI.

**Acceptance Scenarios**:

1. **Given** a subject belongs to Student A, **When** Student B attempts to edit it, **Then** the server denies the operation and does not modify the subject.
2. **Given** a subject belongs to Student A, **When** Student B attempts to delete it, **Then** the server denies the operation and the subject remains in Student A's listing, unchanged.
3. **Given** a subject belongs to Student A, **When** Student B attempts to view it directly (e.g., by guessing or supplying its identifier), **Then** the server denies the operation without revealing whether a subject with that identifier exists.

---

### User Story 4 - Delete a subject I no longer need (Priority: P2)

As an authenticated student, I want to delete a subject I own when it no longer has any associated study tasks, so that I can remove subjects that are no longer relevant to my academic organization.

**Why this priority**: Deletion is destructive and depends on the dependency-safety rule (no orphaned or silently cascaded tasks), so it is sequenced after viewing, editing, and the ownership guarantee are in place.

**Independent Test**: An authenticated student who owns a subject with no associated study tasks can confirm its deletion and verify it is removed from persistence and no longer appears in their listing, without depending on the edit flow being exercised first.

**Acceptance Scenarios**:

1. **Given** the student is the owner of a subject that has no associated study tasks, **When** they confirm its deletion, **Then** the system deletes the subject and it no longer appears in their listing.
2. **Given** the student is the owner of a subject that has one or more associated study tasks, **When** they attempt to delete it, **Then** the system blocks the deletion, reports why it was blocked, and the subject remains in their listing unchanged.

---

### Edge Cases

- What happens when a student submits an edit with only a name change (no description field) or only a description change (no name field)? The system must apply a partial update, leaving the untouched field as-is.
- What happens when an edit trims a name down to whitespace-only? The system must trim before validating and reject it the same way subject creation does.
- What happens when a student attempts to edit or delete a subject id that does not exist at all (never owned by anyone)? The system must deny the operation the same way it denies access to another student's subject, without distinguishing "not found" from "not yours" in the response.
- What happens when a student's session expires between opening the edit/delete UI and submitting the request? The attempt must be treated as unauthenticated and rejected before any data is read or changed.
- What happens when a student attempts to delete a subject twice in quick succession (e.g., a double click)? The second attempt must find no matching owned subject left to delete and must not error the client-visible flow in a way that implies data corruption.
- What happens when a student attempts to delete a subject that has zero associated tasks but another, unrelated subject of theirs has tasks? Only the dependency state of the targeted subject determines whether its deletion is blocked.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated student to retrieve a listing of subjects containing exclusively the subjects owned by that student.
- **FR-002**: The system MUST NOT include any other student's subjects in a listing, detail view, or query result returned to a requesting student.
- **FR-003**: The system MUST allow the owning authenticated student to update the name and/or description of a subject they own, supporting a partial update of either field independently.
- **FR-004**: The system MUST validate an update's name (optional; when present, 1–100 characters after trimming) and description (optional; when present, up to 500 characters) using the same length rules established for subject creation, and MUST require that at least one of name or description be present in the update; an update that fails validation MUST be rejected before any change is persisted, leaving the existing stored data unchanged.
- **FR-005**: The system MUST persist a successful update immediately and make the updated name/description available to the client in the same request/response cycle, so the interface can reflect the new data without a separate manual reload.
- **FR-006**: The system MUST deny any attempt to view, update, or delete a subject that the requesting authenticated student does not own, regardless of how the target subject's identifier was obtained or supplied.
- **FR-007**: When denying a cross-ownership or nonexistent-subject request, the system MUST NOT alter any data and MUST NOT reveal whether a subject with the requested identifier exists under a different owner.
- **FR-008**: The system MUST reject any listing, update, or delete request made without a valid authenticated session, before any protected data is read or changed.
- **FR-009**: The system MUST derive subject ownership for update and delete operations solely from the authenticated session, never from a client-supplied owner or user identifier.
- **FR-010**: The system MUST allow the owning authenticated student to delete a subject they own only when that subject has no associated study tasks.
- **FR-011**: The system MUST block deletion of a subject that has one or more associated study tasks and MUST return an error that communicates why the deletion was blocked, without deleting the subject or any of its associated tasks.
- **FR-012**: Upon successful deletion, the system MUST remove the subject from persistence such that it no longer appears in the owning student's subsequent listings.

### Key Entities *(include if feature involves data)*

- **Subject**: Represents a course or area of study a student organizes work around (introduced in HU03). Relevant attributes for this spec: name (1–100 characters after trimming), description (optional, up to 500 characters), owning student, and a dependency state (whether any study tasks currently reference it) that determines deletion eligibility.
- **Study Task** *(referenced, not owned by this spec)*: Represents a task associated with a subject. This spec only depends on whether at least one study task currently references a given subject; the study task entity's own lifecycle, fields, and management are out of scope here and are expected to be defined by their own future user story.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across test scenarios involving two or more students, 100% of subject listing requests return exclusively the requesting student's own subjects.
- **SC-002**: An authenticated student can update a subject's name and/or description and see the change reflected in the interface within a single interaction, with no manual refresh required.
- **SC-003**: 100% of edit or delete attempts targeting a subject the requesting student does not own are denied by the server and result in zero changes to that subject's stored data.
- **SC-004**: 100% of delete attempts targeting a subject with one or more associated study tasks are blocked, with zero such subjects removed from persistence.
- **SC-005**: A subject deleted while eligible (no associated study tasks) no longer appears in the owning student's listing in the same session, with no manual refresh required.

## Assumptions

- "Authenticated student" and server-derived ownership follow the same session and authorization model established by HU01 (authentication) and HU03 (subject creation); this spec does not redefine either.
- The name/description validation limits (1–100 characters for name, up to 500 for description) reuse the limits already established in HU03 rather than introducing new ones.
- The dependency rule for deletion follows the ticket's recommended strategy: deletion is blocked while a subject has one or more associated study tasks, rather than performing a cascading or soft delete. This is the chosen strategy referenced by FR-010/FR-011 and SC-004.
- The study task entity referenced by the dependency rule is not yet implemented by any prior spec in this codebase; until a study task feature exists, no subject can have associated tasks, so deletion proceeds normally. The blocking check must still be implemented against the eventual study task relationship so it takes effect automatically once tasks exist, without requiring a follow-up change to this feature.
- Denying access to another student's subject and denying access to a nonexistent subject are treated identically at the response level (no existence disclosure), which is a stricter, security-favoring default consistent with the constitution's "Security by Default" principle.
- Deletion confirmation (mentioned in the originating ticket as "confirms the deletion") is a client-side UX affordance; the requirement this spec enforces is that the server performs the delete only after receiving an explicit delete request, not that any particular confirmation UI pattern is mandated.
