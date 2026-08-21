# Feature Specification: Filter and Sort Study Tasks

**Feature Branch**: `feat/US07-filter-sort-study-tasks`

**Created**: 2026-08-20

**Status**: Implemented

**Input**: User description: "Implement US07 - Filter and Sort Study Tasks.

As a student, I want to filter and sort my study tasks, so that I can quickly identify the tasks that require my attention. The authenticated user must be able to filter and sort their own study tasks using supported criteria without exposing another user's information. Filtering must never bypass ownership restrictions; unsupported filter/sort values must be rejected or handled safely rather than producing arbitrary ordering. Depends on HU05 (Create Study Task) and HU06 (Manage Study Tasks); reuses the existing task model and APIs instead of creating a parallel one."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filter my task listing by a supported attribute (Priority: P1)

As an authenticated student, I want to narrow my task listing down by an attribute such as status or subject, so that I can see just the subset of tasks I care about right now instead of scrolling through everything.

**Why this priority**: Filtering is the primary mechanism for reducing a large task list down to what matters "right now," which is the core value proposition of this feature. Without it, sorting alone still leaves every task visible.

**Independent Test**: An authenticated student with tasks in multiple statuses and subjects can apply a single supported filter (e.g., status = pending) and verify the response contains only their own tasks that match that filter, with no other of their tasks and no other student's tasks present.

**Acceptance Scenarios**:

1. **Given** the student has tasks with a mix of `pending` and `completed` status, **When** they filter by status, **Then** only their tasks with the matching status are returned.
2. **Given** the student has tasks under more than one subject, **When** they filter by a specific subject they own, **Then** only their tasks under that subject are returned.
3. **Given** the student filters by a subject that exists but belongs to a different student, **When** the request is processed, **Then** the response is an empty result (never that other student's tasks), consistent with the ownership guarantee established in HU06.
4. **Given** the student applies a supported filter that matches none of their tasks, **When** the request is processed, **Then** the response is a valid empty result, not an error.

---

### User Story 2 - Sort my task listing by a supported criterion (Priority: P1)

As an authenticated student, I want to order my task listing by a criterion such as due date, so that the tasks needing attention soonest surface without me having to scan the whole list manually.

**Why this priority**: Sorting is the other half of the core value: even a filtered list is more useful when ordered by urgency (e.g., due date) rather than an incidental order like creation time.

**Independent Test**: An authenticated student with several tasks having different due dates can request their listing sorted by that criterion and verify the returned tasks appear in the exact expected order, ascending or descending as requested.

**Acceptance Scenarios**:

1. **Given** the student has tasks with different due dates, **When** they request their listing sorted by due date ascending, **Then** tasks are returned soonest-due first, with the existing default order used as a deterministic tiebreaker for equal due dates.
2. **Given** the student has tasks with different due dates, **When** they request the same sort descending, **Then** the order is exactly reversed.
3. **Given** the student requests no sort criterion, **When** the listing is returned, **Then** it uses the same default order HU06 already established (most recently created first), unchanged.

---

### User Story 3 - Reject unsupported filter or sort values safely (Priority: P1)

As the system, I need to safely reject a filter or sort request that uses a value outside the supported set, so that a malformed or malicious request can never bypass ownership restrictions or produce unpredictable database behavior.

**Why this priority**: This is the security and integrity guarantee that makes filtering and sorting trustworthy to expose at all — equivalent in importance to HU06's ownership-denial story. Without it, an unsupported value could otherwise be forwarded as-is into query construction.

**Independent Test**: An authenticated student can submit a request with a filter value or sort field/direction that is not on the supported list and verify the request is rejected with a validation error, that no tasks (their own or anyone else's) are returned as a side effect of the malformed request, and that no data is altered.

**Acceptance Scenarios**:

1. **Given** the student supplies a filter value that is not one of the supported values for that attribute, **When** the request is processed, **Then** it is rejected as a validation error and no task data is returned.
2. **Given** the student supplies a sort field that is not on the supported list, **When** the request is processed, **Then** it is rejected as a validation error rather than being applied as arbitrary ordering.
3. **Given** the student supplies a sort direction other than ascending/descending, **When** the request is processed, **Then** it is rejected as a validation error.
4. **Given** an unauthenticated request supplies any filter or sort parameters, **When** the request is processed, **Then** it is rejected for lack of authentication before any filter or sort logic runs, the same as an unfiltered listing request would be under HU06.

---

### User Story 4 - Combine a filter and a sort criterion (Priority: P2)

As an authenticated student, I want to apply a filter and a sort criterion in the same request, so that I can, for example, see only my pending tasks ordered by how soon they're due.

**Why this priority**: Combining filter and sort is the most valuable everyday use of this feature, but it is additive on top of User Stories 1-3 already working independently and correctly — it composes existing, independently-verified behavior rather than introducing new rules.

**Independent Test**: An authenticated student can submit a request with both a supported filter and a supported sort criterion and verify every returned task satisfies the filter condition and that the set of matching tasks appears in the expected sort order, with ownership still enforced.

**Acceptance Scenarios**:

1. **Given** the student has tasks across multiple statuses and due dates, **When** they filter by status and sort by due date in the same request, **Then** the response contains only tasks matching that status, ordered by due date as requested.
2. **Given** the student supplies a valid filter together with an unsupported sort value (or vice versa), **When** the request is processed, **Then** the entire request is rejected as a validation error rather than partially applying only the valid parameter.

---

### Edge Cases

- What happens when a filter value's case doesn't match the supported value exactly (e.g., "Pending" vs "pending")? The system must not silently accept an unrecognized variant as if it were the canonical value; only exact supported values are accepted, others are rejected as invalid.
- What happens when multiple filters are supplied together (e.g., status and subject)? They combine with AND semantics — a task must satisfy every supplied filter to be included.
- What happens when the student supplies the same filter attribute more than once with conflicting values? The system must not arbitrarily pick one; the request is rejected as invalid rather than silently using the first or last value.
- What happens when a sort criterion is supplied without a direction, or a direction without a criterion? Each supported sort criterion has a defined default direction, and a direction alone (with no criterion) is rejected as invalid since it cannot be applied to anything.
- What happens when two tasks have identical values for the active sort criterion (e.g., the same due date)? Order between them must still be fully deterministic via a documented tiebreaker, not left to incidental database behavior.
- What happens when a student's session expires between loading the task list and applying a new filter/sort? The request is treated as unauthenticated and rejected before any filtering, sorting, or data access occurs, consistent with HU06.
- What happens when a filter/sort request targets a student with zero tasks at all? The response is a valid empty result, not an error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated student to filter their study task listing by task status (`pending`/`completed`).
- **FR-002**: The system MUST allow an authenticated student to filter their study task listing by subject, restricted to subjects that student owns.
- **FR-003**: The system MUST allow an authenticated student to sort their study task listing by due date, in ascending or descending order.
- **FR-004**: The system MUST allow an authenticated student to sort their study task listing by creation date and by title, each in ascending or descending order.
- **FR-005**: The system MUST allow a supported filter and a supported sort criterion to be applied together in the same request, with the result satisfying both conditions simultaneously.
- **FR-006**: The system MUST allow multiple supported filter attributes to be applied together in the same request, combined with AND semantics (a task must match every supplied filter).
- **FR-007**: The system MUST validate every filter and sort query parameter against an explicit, supported allow-list of attributes, values, and directions before applying any of them.
- **FR-008**: The system MUST reject a request containing any unsupported or malformed filter or sort parameter as a validation error, without executing a partial or best-effort version of the request and without returning any task data as part of that rejection.
- **FR-009**: The system MUST restrict every filtered and/or sorted listing result to tasks owned by the requesting authenticated student, using the same server-derived ownership rule established in HU06, regardless of which filter values are supplied (including a syntactically valid subject identifier the student does not own, which MUST yield an empty result rather than another student's data or an error revealing that subject's existence).
- **FR-010**: The system MUST reject any filtered and/or sorted listing request made without a valid authenticated session, before any filter or sort logic is evaluated.
- **FR-011**: The system MUST treat filtering and sorting as optional; a listing request with no filter or sort parameters supplied MUST return the same default listing behavior already established in HU06 (all of the student's own tasks, most recently created first).
- **FR-012**: The system MUST apply a deterministic, documented tiebreaker whenever two or more of the student's tasks are equal on the active sort criterion, so that repeated identical requests return the same order every time.
- **FR-013**: The system MUST NOT construct sort ordering from unvalidated client input; only the explicit, allow-listed sort criteria and directions defined by this feature may influence result ordering.

### Key Entities *(include if feature involves data)*

- **Study Task**: Unchanged shape and ownership rules from HU05/HU06 (title, description, due date, status, owning student, owning subject). This feature adds no new fields; it adds read-only filtering and ordering rules on top of the existing listing already delivered by HU06.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across test scenarios involving two or more students, 100% of filtered listing requests return exclusively tasks that both match the applied filter(s) and are owned by the requesting student.
- **SC-002**: 100% of sorted listing requests return the student's matching tasks in the exact order implied by the requested sort criterion and direction, including deterministic handling of ties.
- **SC-003**: 100% of requests combining a supported filter with a supported sort criterion return a result set that simultaneously satisfies both conditions.
- **SC-004**: 100% of requests containing an unsupported or malformed filter or sort parameter are rejected with a validation error, with zero task records (own or otherwise) exposed and zero changes to stored data.
- **SC-005**: A student can go from "everything" to "just what I need to act on next" in a single request, with no client-side manual re-filtering of an oversized result set required.

## Assumptions

- Supported filter attributes for this iteration are task status (`pending`/`completed`) and subject (limited to subjects the requesting student owns). A due-date range filter (e.g., "overdue" or "due this week") is not included in this iteration; sorting by due date already lets a student prioritize by urgency, and a dedicated range filter can be considered as a future enhancement if requested.
- Supported sort criteria for this iteration are due date, creation date, and title, each with ascending and descending direction; due date sorting most directly serves the "identify tasks that require my attention" goal from the user story.
- "Authenticated student" and server-derived ownership follow the same session and authorization model already established by HU01 (authentication) and reused unchanged by HU05/HU06; this feature does not redefine either.
- This feature only narrows and reorders the existing task listing HU06 already delivers; it does not change single-task retrieval, task creation, editing, or deletion, and does not implement any recommendation or prioritization logic (that is HU08's scope).
- Filtering and sorting are read-only operations; they never modify stored task data, regardless of the parameters supplied.
