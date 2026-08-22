# Feature Specification: Navigation, Dashboard Labels & Filter Reset

**Feature Branch**: `012-nav-dashboard-filters`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "Develop only 3 of the 5 tasks from US13 — Connect Views Instead of Making Students Hunt (GitHub issue #61): AC01 (add the persistent nav link to Study Sessions), AC02 (relabel the dashboard's quick-links to accurately describe their destinations), and AC03 (add a Clear Filters action to the task list). The other two tasks in #61 (AC04 subject→tasks link, AC05 recommendation actionable+why) are explicitly out of scope for this feature."

## Clarifications

### Session 2026-08-22

- Q: ¿Cuándo debe estar visible la acción "Clear filters" en la lista de tareas? → A: Siempre visible junto a los controles de filtro, sin importar si hay filtros activos o cuántos resultados hay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reach Study Sessions from anywhere (Priority: P1)

A student is anywhere in the authenticated app and wants to get to their recorded study sessions. Today the only way there is through a card on the Dashboard — the persistent navigation bar (visible on every authenticated page) does not list it at all, unlike Dashboard, My Subjects, and My Tasks.

**Why this priority**: This is a straightforward discoverability gap affecting every page in the app, every session, for every student. It's the highest-value, lowest-risk fix of the three.

**Independent Test**: From any authenticated page other than Dashboard, use the persistent navigation to reach the Study Sessions view directly, without detouring through the Dashboard.

**Acceptance Scenarios**:

1. **Given** a student is authenticated and viewing any main section of the app, **When** they look at the persistent navigation, **Then** a link to Study Sessions is present alongside Dashboard, My Subjects, and My Tasks.
2. **Given** a student clicks the Study Sessions navigation link, **When** the view loads, **Then** they land on the Study Sessions view.
3. **Given** a student is currently on the Study Sessions view, **When** they look at the persistent navigation, **Then** the Study Sessions link is visually marked as the active section, consistent with how the other links behave.

---

### User Story 2 - Understand what a dashboard quick-link actually does (Priority: P2)

A student on the Dashboard reads the quick-link labels ("Create subject", "Create task", "Record study session") and expects a creation-only form. In reality, each link leads to a full management view where they can also see, edit, and delete their existing subjects, tasks, or sessions — the current wording undersells what's there and can make students think they need to hunt elsewhere to manage what they already created.

**Why this priority**: Second most impactful — it's a trust/clarity issue on the page every student sees first after logging in, but it doesn't block any workflow (the links already work correctly; only their labels are misleading).

**Independent Test**: Read each dashboard quick-link label without clicking it, and confirm it accurately signals a full management view (browse, edit, delete) rather than a creation-only action.

**Acceptance Scenarios**:

1. **Given** a student is on the Dashboard, **When** they read the quick-link that leads to their subjects, **Then** its label communicates a management view (e.g. "My Subjects"), not a creation-only action.
2. **Given** a student is on the Dashboard, **When** they read the quick-link that leads to their tasks, **Then** its label communicates a management view (e.g. "My Tasks"), not a creation-only action.
3. **Given** a student is on the Dashboard, **When** they read the quick-link that leads to their study sessions, **Then** its label communicates a management view (e.g. "Study Sessions"), not a creation-only action.
4. **Given** the relabeling is complete, **When** a student clicks any of the three quick-links, **Then** they are taken to the same destination and functionality as before this change (labels only — no behavior changes).

---

### User Story 3 - Recover from an over-filtered task list (Priority: P3)

A student has narrowed their task list using the status, subject, and/or sort filters and ends up with zero matching results, or simply wants to go back to seeing everything. Today they must reset each filter control individually to get back to the unfiltered view.

**Why this priority**: Real but lower-frequency friction than the first two — it only affects students actively using multiple filters together, whereas User Stories 1 and 2 affect every student on every visit.

**Independent Test**: Apply one or more filters to the task list (including a combination that returns zero results), then use a single action to return to the default, unfiltered view showing all tasks.

**Acceptance Scenarios**:

1. **Given** a student has applied one or more filters to their task list, **When** they want to start over, **Then** a single action resets every active filter (status, subject, sort) back to its default at once.
2. **Given** a student is viewing their task list, **When** the list has any active filters or none at all, **Then** the "Clear filters" action is always visible next to the filter controls, not only when the result set is empty.
3. **Given** a student clears their filters, **When** the reset completes, **Then** the task list reloads to show their full, unfiltered set of tasks.

---

### Edge Cases

- What does the persistent navigation show for the Study Sessions link when a student has never recorded a session (empty state)? It must still be present and reachable — the link's presence does not depend on there being any data.
- What happens if a student clicks "Clear filters" when no filters are currently applied? The action should be a harmless no-op that still leaves the list in its default, unfiltered state.
- What happens if a student clicks "Clear filters" while a previous filter change is still loading? The clear action should still result in the default, unfiltered view being shown once it completes.
- Do the relabeled dashboard quick-links still work correctly for a student with zero subjects, zero tasks, or zero study sessions? Yes — the destination and its existing empty-state handling are unchanged; only the link wording changes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The persistent navigation MUST include a link to the Study Sessions view, alongside the existing Dashboard, My Subjects, and My Tasks links, on every authenticated page.
- **FR-002**: The persistent navigation MUST visually indicate when Study Sessions is the currently active section, using the same visual treatment already applied to the other navigation links.
- **FR-003**: The Dashboard's quick-link labels MUST accurately describe each destination as a full management view (browse, edit, delete existing items), not solely a creation action.
- **FR-004**: Relabeling the Dashboard's quick-links MUST NOT change where each link navigates to or any other existing behavior of the Dashboard.
- **FR-005**: The task list MUST always display a "Clear filters" action next to the filter controls — regardless of whether any filter is currently active or how many results are showing — that resets status, subject, and sort back to their default values in one step.
- **FR-006**: Clearing filters MUST immediately reload the task list so it reflects the default, unfiltered state.
- **FR-007**: The three changes in this feature MUST NOT alter existing data, business rules, authorization/ownership behavior, or the underlying functionality of navigation, the dashboard, or the task list — only discoverability, labeling, and filter-reset convenience are in scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four main sections of the app (Dashboard, My Subjects, My Tasks, Study Sessions) are reachable from the persistent navigation on 100% of authenticated pages.
- **SC-002**: Every one of the Dashboard's three quick-link labels uses management-view wording (e.g. "My Subjects" / "My Tasks" / "Study Sessions") with no creation-only phrasing (e.g. "Create...") remaining.
- **SC-003**: A student with any combination of active task filters can return to the full, unfiltered task list in exactly one action, with zero manual filter-by-filter resets.
- **SC-004**: Existing behavior for the Dashboard, navigation, and task filtering — everything other than the label text and the addition of the nav link and the clear-filters action — is unchanged, verified by the existing automated test suite continuing to pass without modification to unrelated tests.

## Assumptions

- The Study Sessions view already exists and is fully functional today; it is simply missing from the persistent navigation. This feature adds discoverability only.
- The existing task-list filtering mechanism (status, subject, sort, and their combinations) is correct and unchanged; this feature only adds a way to reset it in one step.
- Suggested new labels for the Dashboard quick-links (e.g. "My Subjects", "My Tasks", "Study Sessions") are illustrative; exact wording may be adjusted during implementation as long as each label clearly communicates a management view rather than a creation-only action.
- This feature reuses existing views, routes, and data already available to an authenticated student — no new backend endpoint, data model, or database change is required.
- The other two tasks from the parent story (subject → its tasks quick link; recommended-task card made actionable with an explanation) are explicitly out of scope for this feature and will be specified separately if pursued.
