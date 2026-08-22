# Implementation Plan: UI State & Feedback Consistency

**Branch**: `feat/HU12-feedback-consistency` | **Date**: 2026-08-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-feedback-consistency/spec.md`

## Summary

Nine client-side-only fixes across four independently-shippable stories: (1) the recorded-study-sessions screen always reflects reality — new sessions appear without a reload, failed edits/deletes show the real error and disable the acting control only while pending, deleting uses the app's own inline confirm instead of `window.confirm`, and every session shows when it was recorded (date and time); (2) the subject/task creation forms and the login/register forms never show a stale "success" banner or a stale field error once the student has started correcting it; (3) the subject/task edit forms show the same character-count guidance their creation forms already show; (4) the browser tab reads "StudyFlow". Every fix reuses an interaction pattern, Vue primitive, or Nuxt config option already established elsewhere in this codebase — none adds a dependency, a route, a table, or a migration.

## Technical Context

**Language/Version**: TypeScript 5.9.x on Nuxt 4 / Vue 3 / Node.js 22+ (unchanged from the existing baseline; no version changes).

**Primary Dependencies**: None added. Reuses Vue's own `watch`/`ref`/`reactive`, Nuxt's `app.head` config option, the existing Tailwind utility classes, the existing `$fetch` calls, and the `useTemplateRef` + `@created` + `defineExpose({ refresh })` pattern already implemented for Subjects and Tasks.

**Storage**: N/A. Verified directly against the current code: no `/api/*` route needs a new field, no table needs a new column, and no RLS policy changes — `study_sessions.created_at` already exists and is already returned by `GET /api/study-sessions`, it is simply not rendered by `StudySessionList.vue` today.

**Testing**: Playwright E2E. This codebase has no Vue Test Utils / component-level Vitest precedent for `.vue` files — every existing UI-behavior check (`tests/e2e/*.spec.ts`) is a Playwright test using the shared `gotoForm`/`registerAndLandOnDashboard` helpers, so this feature extends that same pattern rather than introducing a new test layer for nine small UI fixes.

**Target Platform**: Nuxt full-stack web app deployed via Vercel. Unchanged.

**Project Type**: Web application — single Nuxt project. Unchanged.

**Performance Goals**: Not applicable; these are local component-state and markup changes with no new network calls beyond what each page/component already makes.

**Constraints**: No Supabase/DB change of any kind (explicit ticket and spec constraint, re-verified during planning); every fix must reuse an interaction pattern already established elsewhere in the app (event+expose refresh, per-row error+disabled-state map, inline confirm-then-button, character-count markup) rather than introduce a new one, per the constitution's Simplicity principle.

**Scale/Scope**: Nine files modified (`SubjectForm.vue`, `TaskForm.vue`, `SubjectEditForm.vue`, `TaskEditForm.vue`, `StudySessionList.vue`, `study-sessions/index.vue`, `login.vue`, `register.vue`, `nuxt.config.ts`), zero new files in `app/`, two Playwright spec files touched (one extended, one new).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Specification-First Development — rooted in `specs/012-feedback-consistency/spec.md`, including its Clarifications session.
- Pass: Nuxt-Native and Type-Safe Architecture — Vue/Nuxt/TypeScript only; zero new dependencies.
- Pass: Security by Default — no protected resource, route, or ownership boundary is touched; every fix is presentational or local-state; existing server-side authorization is unaffected.
- Pass: Validation and Automated Quality — no new untrusted server input is introduced (nothing here is server-side), so no new Zod schema is needed; Playwright E2E coverage is added for every fix, consistent with the constitution's guidance for user-facing flows.
- Pass: Simplicity, Traceability and Deployability — no new dependencies or services; every fix is traceable to a specific FR in `spec.md`; each of the nine fixes ships and reverts independently.

No constitution violations require exceptions.

**Post-Phase 1 re-check**: Design artifacts (`research.md`, `quickstart.md`) introduce no dependency, table, or route beyond what's stated above. All five gates still pass unchanged after design.

## Project Structure

### Documentation (this feature)

```text
specs/012-feedback-consistency/
├── plan.md          # This file
├── research.md      # Phase 0 output
└── quickstart.md     # Phase 1 output
```

`data-model.md` and `contracts/` are intentionally omitted: the spec's own Key Entities section states no entity is introduced or changed, and no API contract (request/response shape of any endpoint) changes — generating either would be empty boilerplate, which the constitution's Simplicity principle argues against.

### Source Code (repository root)

```text
app/
├── components/
│   ├── subjects/
│   │   ├── SubjectForm.vue          # Modified: an @input handler clears a stale 'success'/'error'
│   │   │                            #   status as soon as the student edits the form again (FR-006)
│   │   └── SubjectEditForm.vue      # Modified: add the same name/description character counters
│   │                                #   SubjectForm.vue already shows (FR-010)
│   ├── tasks/
│   │   ├── TaskForm.vue             # Modified: an @input handler clears a stale 'success'/'error'
│   │   │                            #   status, same pattern as SubjectForm.vue (FR-007)
│   │   └── TaskEditForm.vue         # Modified: add the same title/description character counters
│   │                                #   TaskForm.vue already shows (FR-011)
│   └── study-sessions/
│       └── StudySessionList.vue     # Modified: defineExpose({ refresh }); real, per-row edit/delete
│                                     #   errors with the acting control disabled only while pending
│                                     #   (FR-002, FR-003); inline confirm-then-button replacing
│                                     #   window.confirm (FR-004); recorded date+time per session (FR-005)
└── pages/
    ├── study-sessions/
    │   └── index.vue                # Modified: useTemplateRef + @created wiring StudySessionForm's
    │                                 #   success to StudySessionList's exposed refresh() (FR-001)
    ├── login.vue                    # Modified: clear a field's stale error as soon as that field
    │                                 #   is edited again (FR-008)
    └── register.vue                 # Modified: same as login.vue (FR-009)

nuxt.config.ts                       # Modified: app.head.title = 'StudyFlow' (FR-012)

tests/
└── e2e/
    ├── study-sessions.spec.ts       # Extended: live refresh after recording; edit/delete error
    │                                 #   display + disabled-while-pending; inline confirm; recorded
    │                                 #   date+time (AC01-AC04)
    └── feedback-consistency.spec.ts # New: stale success banners on subject/task creation; stale
                                      #   field errors on login/register; character counters on
                                      #   subject/task edit forms; browser tab title (AC05-AC08)
```

**Structure Decision**: No new component, page, or route is created. Every fix is a modification to an existing file, reusing a pattern already implemented for a sibling entity (Subjects/Tasks patterns extended to Study Sessions; Subjects' and Tasks' own creation-form pattern extended to their own edit forms; a single global Nuxt config option for the page title). Test-wise, `tests/e2e/study-sessions.spec.ts` already exists and is the natural home for the session-specific fixes; `tests/e2e/feedback-consistency.spec.ts` is new only because no existing spec file currently exercises subject/task creation-form banners, login/register field-error persistence, edit-form counters, or the page title together — splitting those four checks across four unrelated existing files would be less traceable than one new file matching this feature's own name.

## Complexity Tracking

No constitution violations or exception justifications identified.
