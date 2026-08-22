# Implementation Plan: Navigation, Dashboard Labels & Filter Reset

**Branch**: `012-nav-dashboard-filters` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-nav-dashboard-filters/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Three independent, single-file UI fixes carved out of US13 (GitHub issue #61): (1) add the missing "Study Sessions" entry to the persistent navigation, (2) relabel the Dashboard's three quick-links so their text matches that they're full management views rather than creation-only forms, and (3) add an always-visible "Clear filters" action to the task list. Each fix reuses an existing, already-established pattern in the same file's own component — no new API endpoint, data model, or Supabase/DB change, and no shared file is touched by more than one of the three.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5 (`<script setup>`), Node.js 22 runtime

**Primary Dependencies**: Nuxt 4 (with Nitro server routes), Tailwind CSS 4 — all already in use; no new dependency is introduced

**Storage**: N/A — no data model, migration, or Supabase query changes; all three fixes reuse data/endpoints already fetched elsewhere in the app

**Testing**: Playwright for end-to-end coverage (`tests/e2e/navigation.spec.ts`, `tests/e2e/tasks-filter-sort.spec.ts` are the natural homes for new assertions). No new Vitest/`@nuxt/test-utils` component tests — there's no isolable business logic here to unit-test (see research.md's "Testing approach" decision).

**Target Platform**: Web (Vercel-hosted Nuxt app), evergreen desktop/mobile browsers

**Project Type**: Web application — single Nuxt 4 project with an integrated frontend (`app/`) and backend (`server/`), not a separate frontend/backend repo split

**Performance Goals**: N/A — no new network calls, computation, or rendering cost beyond a static array entry, two label strings, and a client-side object reset

**Constraints**: Each of the 3 fixes must stay confined to exactly one file (`app/components/AppNav.vue`, `app/pages/dashboard.vue`, `app/components/tasks/TaskList.vue` respectively) — this is a hard constraint from the spec, not just a convenience, since it's what lets 3 people build and merge all of this in parallel with zero file-level conflicts. No fix may alter existing routes, authorization, or the shape of any existing API call.

**Scale/Scope**: 3 files touched total (one per user story), 0 new entities, 0 new endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Specification-First Development | Spec `012-nav-dashboard-filters/spec.md` exists, was clarified, and traces to GitHub issue #61 | PASS |
| II. Nuxt-Native and Type-Safe Architecture | All work stays inside existing Nuxt/Vue/TypeScript files; no new framework, service, or backend | PASS |
| III. Security by Default | No new data access, no new endpoint, no change to authorization/ownership logic (FR-007); every fix is presentation-layer only | PASS |
| IV. Validation and Automated Quality | No new untrusted input to validate (no new endpoint). Existing Playwright suites (`navigation.spec.ts`, `tasks-filter-sort.spec.ts`) will gain assertions for the 3 new behaviors; no critical business rule changes, so no new Vitest server-side tests are required | PASS |
| V. Simplicity, Traceability and Deployability | Single small feature branch referencing issue #61; reuses existing patterns instead of introducing new abstractions; each fix is independently mergeable and keeps `main` deployable | PASS |

No violations. Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/012-nav-dashboard-filters/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated for this feature — see Phase 1 note below.

### Source Code (repository root)

```text
app/
├── components/
│   ├── AppNav.vue                 # User Story 1 — add the Study Sessions link
│   └── tasks/
│       └── TaskList.vue           # User Story 3 — add the "Clear filters" action
├── pages/
│   └── dashboard.vue              # User Story 2 — relabel the three quick-links
└── layouts/
    └── authenticated.vue          # Unmodified — already renders <AppNav /> on every authenticated page

tests/
└── e2e/
    ├── navigation.spec.ts         # Extend: assert the Study Sessions nav link and its active state
    └── tasks-filter-sort.spec.ts  # Extend: assert "Clear filters" is always visible and resets state
```

**Structure Decision**: This is a single Nuxt 4 application (frontend `app/` + integrated Nitro backend `server/` in one codebase — not a split frontend/backend repo). This feature touches only three existing frontend files, one per user story, plus their corresponding Playwright specs. No `server/` file is touched, since none of the three fixes changes what data is fetched or how it's authorized — only what's rendered from data already being fetched today.

## Complexity Tracking

*No violations — this section is intentionally empty.*
