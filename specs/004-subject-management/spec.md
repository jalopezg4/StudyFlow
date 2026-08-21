# Feature Specification: Subject Management

**Feature Branch**: `004-subject-management`

**Created**: 2026-08-18

**Status**: Implemented

**Input**: User description: "HU03 - Crear materia

Como estudiante, quiero crear una materia, para organizar mis tareas y sesiones de estudio según la asignatura correspondiente.

Datos mínimos:
- Nombre obligatorio.
- Descripción opcional.

Reglas de negocio:
1. El nombre no puede estar vacío.
2. El nombre debe tener una longitud máxima definida en la spec.
3. Toda materia debe pertenecer al usuario autenticado.
4. El cliente no puede elegir arbitrariamente el user_id propietario.

Criterios de aceptación:
- CA01: estudiante autenticado registra una materia con nombre válido, la materia se almacena, queda asociada al estudiante autenticado y aparece en su listado de materias.
- CA02: estudiante autenticado intenta crear una materia sin nombre, el sistema rechaza la operación e informa el error de validación.
- CA03: visitante no autenticado intenta utilizar el endpoint de creación de materias, el servidor rechaza la operación.

Dependencies: HU01 (user authentication)."

## Clarifications

### Session 2026-08-18

- Q: What is the maximum allowed length for a subject name? → A: 100 characters, matching common short-label conventions in the app and leaving headroom for realistic course/subject titles.
- Q: What is the maximum allowed length for the optional description? → A: 500 characters, enough for a short free-text note without becoming a full document field.
- Q: Can two subjects belonging to the same student share the same name? → A: Yes. Duplicate names are allowed; subjects are distinguished by their identity, not by uniqueness of name, since students may reasonably reuse names across terms (e.g., "Calculus I" retaken).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a subject to organize study work (Priority: P1)

As an authenticated student, I want to create a subject with a name (and optionally a description) so that I can later organize my study tasks and study sessions under the correct subject.

**Why this priority**: Subject creation is the foundational entry point for all subsequent subject-scoped functionality (tasks, sessions, recommendations). Without it, no other subject-dependent user story can be exercised end-to-end.

**Independent Test**: An authenticated student can submit a subject name through the creation flow and verify the subject appears in their own subject listing, delivering standalone value (a persisted, organizable subject) without depending on any other unfinished feature.

**Acceptance Scenarios**:

1. **Given** the student is authenticated, **When** they submit a subject with a valid, non-empty name, **Then** the subject is stored, is associated with the authenticated student, and appears in that student's subject listing.
2. **Given** the student is authenticated, **When** they submit a subject with a valid name and an optional description, **Then** the subject is stored with both the name and the description.
3. **Given** the student is authenticated, **When** they submit a subject with a valid name and no description, **Then** the subject is stored successfully without requiring a description.

---

### User Story 2 - Be prevented from creating an invalid subject (Priority: P1)

As an authenticated student, I want the system to reject a subject creation attempt that has no name (or a name that is too long) so that my subject list stays meaningful and consistent.

**Why this priority**: Data integrity for the core `subjects` entity must hold from the first write path, since every later feature (tasks, sessions, recommendations) depends on subjects having a usable name.

**Independent Test**: An authenticated student can attempt to submit a subject with an empty name (or a name exceeding the maximum length) and verify the operation is rejected with a validation error, without needing any other feature to be implemented.

**Acceptance Scenarios**:

1. **Given** the student is authenticated, **When** they attempt to create a subject with an empty name, **Then** the system rejects the operation and reports a validation error.
2. **Given** the student is authenticated, **When** they attempt to create a subject with a name consisting only of whitespace, **Then** the system rejects the operation and reports a validation error.
3. **Given** the student is authenticated, **When** they attempt to create a subject with a name longer than the maximum allowed length, **Then** the system rejects the operation and reports a validation error.
4. **Given** the student is authenticated, **When** they attempt to create a subject with a description longer than the maximum allowed length, **Then** the system rejects the operation and reports a validation error.

---

### User Story 3 - Be blocked from creating subjects while unauthenticated (Priority: P1)

As the system, I need to reject any subject creation attempt from a visitor who is not authenticated, so that subjects can never be created without a legitimate owner.

**Why this priority**: This enforces the ownership guarantee that underpins every other subject-related capability; without it, subjects could exist without a valid, authenticated owner, corrupting the data model and violating the security baseline.

**Independent Test**: A request to create a subject can be issued without a valid authenticated session and verified to be rejected by the server, independent of the UI or any other feature.

**Acceptance Scenarios**:

1. **Given** the visitor is not authenticated, **When** they attempt to use the subject creation capability, **Then** the server rejects the operation.
2. **Given** a request to create a subject is made with a client-supplied owner identifier different from any authenticated session, **When** the server processes the request, **Then** the server determines ownership from the authenticated session and never from client-supplied input.

---

### Edge Cases

- What happens when the name contains only leading/trailing whitespace around otherwise valid text? The system must trim whitespace before validating and storing the name.
- What happens when a student submits a description without a name? The system must reject the request as an empty/missing name, regardless of whether a description was supplied.
- What happens when a student submits an empty string for description (as opposed to omitting it)? The system must treat it as "no description" rather than as a validation failure.
- What happens when a client includes a `user_id` or owner field in the creation request payload? The server must ignore any client-supplied ownership value and derive the owner solely from the authenticated session.
- How does the system behave when the same authenticated student submits two subjects with the identical name? Both are created as distinct subjects; name uniqueness is not enforced.
- What happens when the authenticated session expires between loading the creation form and submitting it? The creation attempt must be treated as unauthenticated and rejected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated student to create a subject by providing a name and, optionally, a description.
- **FR-002**: The system MUST require the subject name to be present and non-empty (after trimming whitespace); requests with an empty or whitespace-only name MUST be rejected with a validation error.
- **FR-003**: The system MUST enforce a maximum subject name length of 100 characters; requests exceeding this length MUST be rejected with a validation error.
- **FR-004**: The system MUST treat the subject description as optional; requests omitting a description or supplying an empty description MUST succeed.
- **FR-005**: The system MUST enforce a maximum subject description length of 500 characters when a description is supplied; requests exceeding this length MUST be rejected with a validation error.
- **FR-006**: The system MUST associate every created subject with exactly one owning student, determined from the authenticated session at request time.
- **FR-007**: The system MUST NOT allow the client to specify or influence which student a subject is owned by; any client-supplied owner/user identifier in the request MUST be ignored in favor of the authenticated session's identity.
- **FR-008**: The system MUST reject any subject creation attempt made without a valid authenticated session, before any data is persisted.
- **FR-009**: The system MUST make a newly created subject visible in the owning student's subject listing.
- **FR-010**: The system MUST prevent one student from creating a subject on behalf of, or attributed to, another student.
- **FR-011**: The system MUST return a validation error response that clearly communicates the failing rule (empty name, name too long, or description too long) without exposing internal implementation details.

### Key Entities *(include if feature involves data)*

- **Subject**: Represents a course or area of study a student wants to organize work around. Key attributes: name (required, 1–100 characters after trimming), description (optional, up to 500 characters), owning student, creation timestamp. Always belongs to exactly one authenticated student; a student may own many subjects; subject names are not required to be unique per student.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authenticated student can create a valid subject and see it reflected in their subject listing in a single interaction, with no manual refresh or additional step required.
- **SC-002**: 100% of subject creation attempts with an empty, whitespace-only, or over-length name are rejected with a validation error and result in zero persisted records.
- **SC-003**: 100% of subject creation attempts made without a valid authenticated session are rejected by the server and result in zero persisted records.
- **SC-004**: 100% of subjects stored in the system have a non-null owning student that matches the authenticated identity that created them, verified independently of any client-supplied input.
- **SC-005**: A student can never observe, in their own subject listing, a subject created by a different student.

## Assumptions

- "Authenticated student" refers to any user with a valid session established by the authentication capability delivered in HU01; this spec does not redefine authentication itself.
- Subject creation is a single-step operation (no draft/multi-step wizard) for this user story; multi-step creation flows are out of scope.
- Editing, deleting, or listing subjects beyond "appears in the listing after creation" are out of scope for this spec and are expected to be covered by their own user stories.
- Maximum lengths (100 characters for name, 500 characters for description) are product decisions made to unblock delivery for this iteration; they can be revisited via a future spec amendment if product requirements change.
- Duplicate subject names for the same student are permitted; no uniqueness constraint is required by this user story.
- The client is any untrusted caller (browser UI, script, or direct API call); "server-derived ownership" applies regardless of caller type.
