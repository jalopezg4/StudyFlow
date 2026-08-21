# Implementation Plan: My Subjects and My Tasks Navigation & UX Polish

**Branch**: `feat/US11-nav-ux` | **Date**: 2026-08-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-nav-ux-polish/spec.md`

## Summary

Add a persistent, reusable navigation bar (`AppNav.vue`) — Dashboard / My Subjects / My Tasks / Log out, with the active section visually highlighted — surfaced via a new Nuxt layout (`app/layouts/authenticated.vue`) that only the three already-authenticated pages (`dashboard.vue`, `subjects/index.vue`, `tasks/index.vue`) opt into. No new routes, no new list/detail views, no server-side changes: `SubjectList.vue` and `TaskList.vue` keep rendering exactly as they do today. The now-redundant per-page "← Back to dashboard" links and the dashboard's own inline "Log out" button are removed since the persistent nav replaces both, closing a real, previously-unaddressed gap: logging out was only possible from the dashboard.

## Technical Context

**Language/Version**: TypeScript 5.9.x on Nuxt 4 / Node.js 22+ (unchanged)

**Primary Dependencies**: Nuxt 4, Vue 3, Tailwind CSS, existing `useAuth()` composable (`app/composables/useAuth.ts`). No new runtime dependencies.

**Storage**: None — this feature touches no table, column, migration, or API contract. Purely presentational.

**Testing**: Playwright E2E, following the established pattern in `tests/e2e/` (Firefox + Chromium, using the shared `registerAndLandOnDashboard`/`gotoForm` helpers from `tests/e2e/helpers.ts`). This codebase has no existing Vue component unit-test harness (`@vue/test-utils` is not used anywhere), so navigation/active-state behavior is validated end-to-end through real page loads rather than isolated component mounts, consistent with how every other UI-facing HU (US07, US08) was verified in this project.

**Target Platform**: Nuxt full-stack web app deployed via Vercel; unchanged.

**Project Type**: Web application — single Nuxt project, no new services. Unchanged.

**Performance Goals**: Not applicable — a static navigation component with no data fetching of its own.

**Constraints**: Must not introduce a second data-fetching path, route, or view for subjects/tasks (FR-005); must not change any server-side route, schema, or authorization rule (spec.md Assumptions); must preserve every existing acceptance scenario from HU03-HU08 unchanged (User Story 3, FR-006).

**Scale/Scope**: One new component (`AppNav.vue`), one new layout (`authenticated.vue`), three modified pages (`dashboard.vue`, `subjects/index.vue`, `tasks/index.vue`), one new E2E spec.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Specification-First Development — rooted in `specs/009-nav-ux-polish/spec.md` (US11).
- Pass: Nuxt-Native and Type-Safe Architecture — uses Nuxt's own layout system (`app/layouts/`) rather than a custom shell component pattern; Vue/TypeScript only, no new dependency.
- Pass: Security by Default — no server-side surface touched; Log out reuses the existing `useAuth().logout()` composable unchanged; no new client-side authorization logic (route protection remains entirely in `app/middleware/auth.global.ts`, untouched).
- Pass: Validation and Automated Quality — no untrusted input introduced (a nav bar has no form fields); automated E2E coverage required for the navigation behavior itself, and the full existing HU03-HU08 automated suite (unit + E2E) must keep passing unchanged as the regression gate for User Story 3.
- Pass: Simplicity, Traceability and Deployability — single Nuxt project, no new services, no new tables, no new API routes; traceable to the US11 GitHub Issue (#37) and this spec/plan.

No constitution violations require exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/009-nav-ux-polish/
├── plan.md                # This file
├── research.md            # Phase 0 output
├── data-model.md          # Phase 1 output
├── quickstart.md          # Phase 1 output
├── contracts/
│   └── navigation-contract.md   # Phase 1 output
└── tasks.md                # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
app/
├── app.vue                          # Extended: wraps <NuxtPage /> in <NuxtLayout> so app/layouts/ actually activates
├── components/
│   └── AppNav.vue                  # New: persistent nav (Dashboard / My Subjects / My Tasks / Log out)
├── layouts/
│   └── authenticated.vue           # New: wraps AppNav + page content
└── pages/
    ├── dashboard.vue                # Extended: opts into the authenticated layout; inline Log out button removed
    ├── subjects/
    │   └── index.vue                # Extended: opts into the authenticated layout; "Back to dashboard" link removed
    └── tasks/
        └── index.vue                # Extended: opts into the authenticated layout; "Back to dashboard" link removed

tests/
└── e2e/
    └── navigation.spec.ts           # New: nav presence, active-state, logout-from-any-page
```

**Structure Decision**: Pure additive UI layer — no new directories beyond the standard Nuxt `app/layouts/` (unused until now; this is its first occupant). `AppNav.vue` is the single source of truth for the nav's links and active-state logic, referenced only from `authenticated.vue`, so there is exactly one place this behavior can drift. `SubjectList.vue`/`TaskList.vue`/their pages' existing scripts are otherwise untouched — only the wrapping template (layout opt-in, removal of now-redundant links) changes. `app/app.vue` required one line changed (research.md Decision 6) since Nuxt's layout system is inert without `<NuxtLayout>` wrapping `<NuxtPage />`.

## Complexity Tracking

No constitution violations or exception justifications identified.
