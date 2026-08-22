# Implementation Plan: Study Session Feedback & Refresh Fixes

**Branch**: `001-fix-session-feedback-loop` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-fix-session-feedback-loop/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Fix three interlocking UI state bugs in the recorded-study-sessions flow: the list never refreshes after a successful recording, edit/delete errors are set but never rendered, deletion uses a native `window.confirm` instead of the app's inline two-step pattern, and the recorded date is never shown. All four outcomes are achieved by making `StudySessionForm.vue` emit a `created` event, wiring `app/pages/study-sessions/index.vue` to call the list's exposed `refresh()` on that event (mirroring `app/pages/subjects/index.vue`), and fixing `StudySessionList.vue`'s own local state (`defineExpose`, per-session error rendering, inline confirm/cancel, `createdAt` display) using the existing `SubjectList.vue` pattern as the reference implementation. No API, schema, or database changes are required — the backend already returns `createdAt` and already supports PATCH/DELETE with error responses.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5 `<script setup>`

**Primary Dependencies**: Nuxt 4.5 (Nitro server routes, already implemented and unchanged), Vue 3 Composition API (`ref`, `computed`, `reactive`, `useTemplateRef`, `defineExpose`)

**Storage**: N/A for this feature — reuses existing Supabase-backed `/api/study-sessions` endpoints (GET list, PATCH, DELETE) without modification

**Testing**: Vitest + Nuxt Test Utils for component-level assertions if added; Playwright for the existing `tests/e2e/study-sessions.spec.ts` suite, extended to cover refresh/error/confirm/date behavior

**Target Platform**: Browser (Nuxt SSR/CSR web app)

**Project Type**: Web application — single Nuxt project (no separate frontend/backend split; `app/` is the Vue/Nuxt client layer, `server/` is Nitro)

**Performance Goals**: No new performance constraints; interactions must feel instant (list refresh and confirm/cancel are local state or a single fetch, no added round-trips beyond the existing `refresh()`/`saveEdit`/`removeSession` calls)

**Constraints**: Must reuse the existing `SubjectList.vue` confirm pattern (`requestDelete`/`confirmDelete`/`cancelDelete` + per-item `deleteErrors`) and the existing `subjects/index.vue` refresh wiring (`useTemplateRef` + `@created`) rather than introducing a new pattern; no changes to Supabase schema, RLS, or API contracts

**Scale/Scope**: 3 files touched (`app/components/study-sessions/StudySessionForm.vue`, `app/pages/study-sessions/index.vue`, `app/components/study-sessions/StudySessionList.vue`); no new files required for the fix itself

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Specification-First Development**: PASS — spec.md exists and is approved before this plan; this plan and the eventual tasks.md keep the GitHub Issue #60 → spec → plan → tasks → code chain traceable.
- **II. Nuxt-Native and Type-Safe Architecture**: PASS — the fix stays entirely within existing Nuxt 4 / Vue 3 / TypeScript components and reuses the app's established `defineExpose`/event-emit patterns; no new framework or service introduced.
- **III. Security by Default**: PASS (no change) — no auth/authorization logic is touched; the feature only fixes client-side rendering of data and errors already scoped server-side to the authenticated owner.
- **IV. Validation and Automated Quality**: PASS — no new untrusted server input is introduced (no API changes), so no new Zod validation is needed; existing Playwright E2E coverage for study sessions will be extended to cover the four fixed behaviors.
- **V. Simplicity, Traceability and Deployability**: PASS — no new dependencies or architecture; changes are scoped to 3 files matching an established in-repo pattern, keeping main deployable.

No violations. Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-session-feedback-loop/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command) — not needed, see below
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/
├── components/
│   └── study-sessions/
│       ├── StudySessionForm.vue   # add `created` emit on successful submit
│       └── StudySessionList.vue   # defineExpose(refresh), per-session error render,
│                                    inline confirm/cancel, createdAt display
├── pages/
│   └── study-sessions/
│       └── index.vue              # useTemplateRef + @created="list.refresh()"
│                                    (mirrors app/pages/subjects/index.vue)
└── components/
    └── subjects/
        ├── SubjectForm.vue        # reference pattern for the `created` emit (read-only)
        └── SubjectList.vue        # reference pattern for defineExpose + confirm (read-only)

server/
└── api/study-sessions/            # existing endpoints, unchanged by this feature
    ├── index.get.ts
    ├── index.post.ts
    ├── [id].patch.ts
    └── [id].delete.ts

tests/
├── e2e/
│   └── study-sessions.spec.ts     # extend with refresh/error/confirm/date scenarios
└── study-sessions/
    └── manage-sessions.spec.ts    # existing server-side tests, unchanged
```

**Structure Decision**: Single Nuxt 4 project (no frontend/backend split — `app/` is the
Vue client layer, `server/` is Nitro). This feature only touches three files under
`app/components/study-sessions/` and `app/pages/study-sessions/`, following the existing
`app/components/subjects/` and `app/pages/subjects/index.vue` pattern as the reference
implementation. No new directories are introduced.

## Complexity Tracking

*No Constitution Check violations — this section is not applicable.*
