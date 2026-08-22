# Implementation Plan: Study Sessions Feedback Loop

**Branch**: `feat/US12-study-sessions-feedback-loop` | **Date**: 2026-08-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-study-sessions-feedback-loop/spec.md`

## Summary

Wire `StudySessionForm.vue` → `study-sessions/index.vue` → `StudySessionList.vue` together the same way `SubjectForm`/`TaskForm` already wire to their own list pages, and fix four local state bugs already living in `StudySessionList.vue` (an error message that's set but never rendered, a native `window.confirm` dialog where every sibling list uses an inline confirm, and a missing recorded-date display). No server, schema, or API change of any kind — this is a client-only fix reusing patterns that already exist twice over in this codebase (Subjects, Tasks).

## Technical Context

**Language/Version**: TypeScript 5.9.x on Nuxt 4 / Vue 3 (unchanged)

**Primary Dependencies**: None new. Reuses existing `$fetch`, `useTemplateRef`, `defineEmits`/`defineExpose` patterns already established in `app/components/tasks/TaskForm.vue`, `app/pages/tasks/index.vue`, and `app/components/subjects/SubjectList.vue`.

**Storage**: No change. `study_sessions` table, its RLS policies, and the `server/api/study-sessions/*` routes are untouched.

**Testing**: This codebase has no Vue component-level test layer (`vitest.config.ts` runs in `environment: 'node'`, tests only cover server handlers/schemas). The only place UI wiring/rendering is exercised is Playwright E2E. `tests/e2e/study-sessions.spec.ts` already has one scenario (record a session, see the success message); it's extended here to actually assert AC01 (list refresh), AC03/confirm pattern, and AC04 (recorded date), and a new scenario is added for AC02 (real error surfaced on a failed action).

**Target Platform**: Nuxt full-stack web app deployed via Vercel; unchanged.

**Project Type**: Web application — single Nuxt project. Unchanged.

**Performance Goals**: Not applicable — no new network calls beyond what already exists (the list already re-fetches on mount; this only adds triggering that same fetch from one more place).

**Constraints**: Must not touch `server/api/study-sessions/*`, `server/utils/study-sessions/*`, or any migration — this is scoped to 3 files only, per the parent issue's explicit "one file per task, no shared files" design.

**Scale/Scope**: 3 files changed (`StudySessionForm.vue`, `study-sessions/index.vue`, `StudySessionList.vue`), 1 E2E test file extended.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Specification-First Development — rooted in `specs/012-study-sessions-feedback-loop/spec.md`, itself scoped from issue #60.
- Pass: Nuxt-Native and Type-Safe Architecture — Vue 3/TypeScript only, no new dependency.
- Pass: Security by Default — not applicable; no auth/authorization/data-access code is touched. All three files are pure presentation/wiring.
- Pass: Validation and Automated Quality — no untrusted server input is introduced (client-only change), so Zod validation is not applicable here; Playwright E2E coverage is added/extended for the user-facing behavior, consistent with the constitution's guidance that critical end-to-end flows should have such coverage.
- Pass: Simplicity, Traceability and Deployability — reuses existing patterns verbatim rather than inventing new ones; no new dependency, table, or service; traceable to issue #60 and this spec/plan.

No constitution violations require exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/012-study-sessions-feedback-loop/
├── plan.md                # This file
├── spec.md                # Already written
├── checklists/
│   └── requirements.md    # Already written
└── tasks.md               # Phase 2 output
```

### Source Code (repository root)

```text
app/
├── components/
│   └── study-sessions/
│       ├── StudySessionForm.vue   # Add `created` emit (FR-001)
│       └── StudySessionList.vue   # Add refresh() expose, fix error display,
│                                  # inline confirm, recorded-date display
│                                  # (FR-003, FR-004, FR-005, FR-006)
└── pages/
    └── study-sessions/
        └── index.vue               # Wire @created -> list.refresh() (FR-002)

tests/
└── e2e/
    └── study-sessions.spec.ts     # Extended with AC01-AC04 assertions
```

**Structure Decision**: No new files, no new grouping — this only edits the three files the parent issue already named, following the exact wiring/list patterns already established by `app/pages/subjects/index.vue` + `SubjectList.vue` and `app/pages/tasks/index.vue` + `TaskList.vue`.

## Complexity Tracking

No constitution violations or exception justifications identified.
