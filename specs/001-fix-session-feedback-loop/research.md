# Phase 0 Research: Study Session Feedback & Refresh Fixes

No unresolved `NEEDS CLARIFICATION` markers remain in the Technical Context — this is a
small, tightly-scoped bug fix inside an existing, well-understood codebase. Research below
documents the decisions made by reading the existing implementation rather than external
sources.

## Decision 1: How to trigger a list refresh after recording a session

- **Decision**: `StudySessionForm.vue` emits a `created` event with the created session
  payload on successful submit; `app/pages/study-sessions/index.vue` holds a
  `useTemplateRef` to `StudySessionList` and calls `.refresh()` in the `@created` handler.
- **Rationale**: This is the exact pattern already implemented for Subjects
  (`app/components/subjects/SubjectForm.vue` → `app/pages/subjects/index.vue` →
  `app/components/subjects/SubjectList.vue`) and for Tasks. Reusing it keeps the codebase
  consistent and requires no new state-management approach.
- **Alternatives considered**:
  - A shared reactive store (Pinia/composable) for sessions — rejected as unnecessary
    complexity for a single parent/child refresh relationship; the constitution's
    Simplicity principle and the existing sibling-component precedent both argue against it.
  - Polling the list on an interval — rejected as wasteful and not instant, and it doesn't
    match the "immediately, no manual reload" requirement (FR-001/SC-001).

## Decision 2: How to surface per-session edit/delete errors

- **Decision**: Keep `errorMessage` local to `StudySessionList.vue`'s script, but fix the
  template so it renders whenever `errorMessage` is non-empty — not gated behind the
  page-level `status === 'error'` condition (which is never true again once the initial
  load succeeds).
- **Rationale**: The bug is a template-rendering condition bug, not a missing state bug —
  `errorMessage.value` is already being set correctly in `saveEdit`/`removeSession`'s
  `catch` blocks. The fix is local and minimal, per Simplicity principle.
- **Alternatives considered**: Per-session error map (`Record<string, string>`, as
  `SubjectList.vue` uses for `deleteErrors`) — adopted for the *delete* confirm flow (see
  Decision 3) since it must be keyed by session id anyway for the two-step confirm; reused
  for delete errors specifically so the error sits next to the right session even if
  multiple sessions have deletion attempted in the same page life. Edit errors remain a
  single `errorMessage` since only one session can be in edit mode (`editingId`) at a time.

## Decision 3: How to replace `window.confirm` with the inline pattern

- **Decision**: Port `SubjectList.vue`'s `confirmingDeleteId` / `deleteErrors` (keyed
  `Record<string, string>`) / `requestDelete(id)` / `cancelDelete(id)` /
  `confirmDelete(id)` shape into `StudySessionList.vue`, replacing the
  `window.confirm('Delete this study session?')` call in `removeSession`.
- **Rationale**: Reuses a pattern already reviewed and shipped in production for Subjects;
  satisfies FR-004/FR-005 and Edge Case "only one session's confirmation active at a time"
  for free, since `confirmingDeleteId` is a single ref.
- **Alternatives considered**: A generic reusable `<ConfirmAction>` component — rejected as
  out of scope; the task list explicitly asks for the same *pattern*, not a new shared
  component, and introducing one now would touch `SubjectList.vue`/`TaskList.vue` too,
  which is outside this feature's file scope.

## Decision 4: How to display the recorded date

- **Decision**: Render `session.createdAt` (already returned by `GET /api/study-sessions`
  and already typed on the `StudySession` interface in `StudySessionList.vue`) as a
  locale-formatted date string in each list item.
- **Rationale**: The data already exists end-to-end (confirmed in
  `server/utils/study-sessions/repository.ts` and `tests/study-sessions/manage-sessions.spec.ts`,
  which asserts `createdAt` on update responses); this is purely a template addition.
- **Alternatives considered**: Formatting via a new date utility/library — rejected;
  `Intl.DateTimeFormat` (or a simple `new Date(...).toLocaleDateString()`) is sufficient and
  avoids a new dependency, matching the Simplicity principle and the "no new dependencies"
  constitution constraint.

## Summary

All four decisions reuse existing, already-shipped patterns from `SubjectForm.vue`,
`SubjectList.vue`, and `subjects/index.vue`. No new libraries, endpoints, or architectural
elements are introduced.
