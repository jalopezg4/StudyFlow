# Feature Specification: My Subjects and My Tasks Navigation & UX Polish

**Feature Branch**: `feat/US11-nav-ux`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "Implement US11 - My Subjects and My Tasks Navigation & UX Polish. As a student, I want a clearer and more visually polished interface with dedicated sections for my subjects and study tasks, so that I can easily understand, access, and manage my study information without having to enter creation flows first. Reuse the existing subject and task functionality; do not duplicate existing business logic. Verified against the current repository: /subjects and /tasks already implement viewing, filtering, sorting, editing, completing, and deleting the user's own subjects/tasks, with empty/loading/error states and ownership enforcement already in place. The actual gap is navigation/information-architecture and labeling — the dashboard's links read 'Create subject'/'Create task' (implying creation only), and there is no persistent navigation between authenticated pages. This spec is about fixing navigation, labeling, and cross-page UX consistency, not rebuilding existing views."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find and open my subjects and tasks without creating something first (Priority: P1)

As an authenticated student, I want clearly labeled "My Subjects" and "My Tasks" links in the app's navigation, so that I understand those pages let me see and manage what I already have, not just create something new.

**Why this priority**: This is the actual, verified gap. The list/manage views already exist (`/subjects`, `/tasks`) and already work; the problem is purely that nothing in the navigation currently signals that. Without a labeling fix, students may believe there's no way to review their existing subjects/tasks and never discover functionality that already ships.

**Independent Test**: An authenticated student on any authenticated page can find and click a navigation link labeled to indicate "my subjects" and one labeled to indicate "my tasks," land on the respective existing page, and see their own data — all without having to submit a create form first.

**Acceptance Scenarios**:

1. **Given** an authenticated student is on the dashboard, **When** they look at the navigation, **Then** they see distinct, clearly labeled options for viewing their subjects and their tasks (not just "Create subject" / "Create task").
2. **Given** an authenticated student is on any authenticated page (dashboard, subjects, tasks), **When** they want to go to the other sections, **Then** a consistent navigation element is available without needing to return to the dashboard first.
3. **Given** an authenticated student opens "My Subjects" or "My Tasks", **When** the page loads, **Then** they land directly on the existing subjects/tasks list (no intermediate creation step required to see it).
4. **Given** an authenticated student is on a given section, **When** they view the navigation, **Then** the currently active section is visually distinguishable from the others.

---

### User Story 2 - Consistent look and feel across the app's main sections (Priority: P2)

As an authenticated student, I want the dashboard, subjects, and tasks pages to feel like one consistent product, so that moving between them doesn't feel jarring or unpolished.

**Why this priority**: Valuable and explicitly requested, but additive on top of User Story 1 — the navigation fix alone already delivers the core "I can find my stuff" value; visual consistency is a refinement on top of that, not a blocker to it.

**Independent Test**: A student navigating dashboard → subjects → tasks → dashboard can confirm consistent spacing, typography, button styles, and interactive states (hover/focus/disabled) across all four screens, without needing any specific data present.

**Acceptance Scenarios**:

1. **Given** a student moves between the dashboard, subjects, and tasks pages, **When** they compare headings, buttons, and spacing, **Then** the same visual patterns are used throughout (no page looks like it belongs to a different app).
2. **Given** a student is viewing the app on a narrower screen (e.g., a laptop or tablet width), **When** they navigate between sections, **Then** the layout and primary actions remain usable and are not cut off or overlapping.

---

### User Story 3 - Nothing that already works stops working (Priority: P1)

As an authenticated student, I want all my existing subject and task capabilities (create, edit, filter, sort, complete, delete, recommendations) to keep working exactly as before, so that a navigation/UX refresh doesn't cost me functionality I already rely on.

**Why this priority**: This is a regression-prevention guarantee, not new functionality — but it is equally critical, matching the pattern every prior HU in this codebase has used for its own non-negotiable "don't break existing guarantees" story. A navigation-only change that silently broke filtering or ownership enforcement would be a net loss even if the navigation looked nicer.

**Independent Test**: Every acceptance scenario already established by US03-US07 (create/view/edit/delete a subject; create/view/edit/complete/delete/filter/sort a task; cross-student denial) can still be reproduced after this feature ships, unchanged.

**Acceptance Scenarios**:

1. **Given** a student has existing subjects, **When** they open "My Subjects", **Then** all subjects are listed exactly as `SubjectList.vue` already renders them today, with create/edit/delete still available.
2. **Given** a student has existing tasks, **When** they open "My Tasks", **Then** all tasks are listed exactly as `TaskList.vue` already renders them today, with create/edit/complete/delete/filter/sort/recommendation still available.
3. **Given** a student has no subjects (or no tasks), **When** they open the respective section, **Then** the existing empty-state message and call to action are still shown, unchanged.
4. **Given** two students each own data, **When** either opens "My Subjects" or "My Tasks", **Then** only their own data is ever shown — server-side ownership enforcement is untouched by this UX-only feature.

---

### Edge Cases

- What happens if a student navigates directly to `/subjects` or `/tasks` by URL, bypassing the dashboard entirely? The same navigation element must still be present and correctly indicate the active section — discoverability doesn't depend on having started from the dashboard.
- What happens on a very narrow (mobile-width) screen where a full navigation bar can't fit comfortably? The navigation must degrade to a still-usable pattern (e.g., stacking or collapsing) rather than overflowing or hiding primary actions; a dedicated mobile-specific navigation pattern (e.g., a hamburger menu) is not required for this iteration if the existing simple layout already remains usable at supported widths (see Assumptions).
- What happens to the current "Back to dashboard" links on the subjects/tasks pages? They may be superseded by the new consistent navigation, but the dashboard must remain reachable from every authenticated page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a navigation element, present on every authenticated page, with distinct entries for the dashboard, the student's subjects, and the student's tasks.
- **FR-002**: The navigation entries for subjects and tasks MUST be labeled to indicate viewing/managing existing data (e.g., "My Subjects" / "My Tasks"), not only creation.
- **FR-003**: Selecting the subjects or tasks navigation entry MUST land the student directly on the existing subjects list (`/subjects`) or tasks list (`/tasks`) — no intermediate creation step.
- **FR-004**: The navigation MUST visually indicate which section is currently active.
- **FR-005**: The system MUST continue to reuse the existing `SubjectList.vue`/`TaskList.vue` components and their existing API calls; this feature MUST NOT introduce a second view, route, or data-fetching path for subjects or tasks.
- **FR-006**: All existing subject and task functional behavior (create, edit, delete, complete, filter, sort, recommendation, empty/loading/error states, ownership enforcement) MUST remain available and unchanged after this feature ships.
- **FR-007**: The dashboard, subjects, and tasks pages MUST share a consistent visual pattern for navigation, headings, spacing, and interactive element states (hover, focus, disabled, active).
- **FR-008**: The navigation and the pages it links to MUST remain usable at the screen widths the application already supports today (see Assumptions) — no broken layout, no inaccessible primary action.

### Key Entities *(include if feature involves data)*

- No new entities. This feature is a presentation/navigation layer over the existing Subject and Study Task entities (unchanged since HU03-HU08); it introduces no new fields, tables, or API contracts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any authenticated page, a student can reach their existing subjects list and their existing tasks list in a single navigation action (one click/tap), without passing through a create form.
- **SC-002**: 100% of existing automated test coverage for subjects (HU03/HU04) and tasks (HU05/HU06/HU07/HU08) continues to pass unchanged after this feature ships.
- **SC-003**: A student can visually identify, without prior explanation, which of the three main sections (dashboard, subjects, tasks) they are currently viewing.
- **SC-004**: The navigation and its destination pages remain fully usable (no cut-off buttons, no overlapping text, no unreachable primary action) at the range of screen widths the application already supports.

## Assumptions

- "Supported screen sizes" means the range this application already targets today (a single-column, desktop/laptop-oriented layout, consistent with every existing page in this codebase); no dedicated mobile navigation pattern (e.g., a hamburger menu) is introduced unless the existing simple layout genuinely breaks at common laptop/tablet widths.
- This feature only changes navigation, labeling, and shared visual styling. It does not add, remove, or change any server-side route, schema, or business rule — no backend changes are anticipated.
- "My Subjects" and "My Tasks" are the working labels for the navigation entries; final copy may be adjusted during implementation as long as it clearly communicates "view/manage your existing data," not "create new."
- This feature does not implement HU09 (Track Study Session) or HU10 (Study Progress Dashboard) navigation — only the sections that already exist (dashboard, subjects, tasks) are in scope.
