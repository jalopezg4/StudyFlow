# Research: My Subjects and My Tasks Navigation & UX Polish

## Decision 1: A Nuxt layout, not a shared component manually imported into each page

- Decision: Create `app/layouts/authenticated.vue` (wrapping `<AppNav />` + `<slot />`) and have `dashboard.vue`, `subjects/index.vue`, and `tasks/index.vue` opt in via `definePageMeta({ layout: 'authenticated' })`, rather than importing and placing `<AppNav />` manually at the top of each page's own template.
- Rationale: Nuxt's layout system exists exactly for "the same chrome around several pages" — using it is the idiomatic, native-Nuxt way (constitution's Nuxt-Native principle) and guarantees the three pages can never drift out of sync with each other's nav markup, since there is only one place (`authenticated.vue`) that renders it. `app/layouts/` has existed as an expected-but-empty directory since HU01 bootstrap (noted as a gap in `specs/001-project-bootstrap/tasks.md`'s Traceability Notes) — this is its first real use, closing that gap naturally rather than as a separate cleanup task.
- Alternatives considered: Import `<AppNav />` directly into each of the three pages' own `<template>` — rejected; three independent copies of "where does the nav go in the page structure" is exactly the kind of drift a layout exists to prevent, for no benefit over the layout approach.

## Decision 2: Public pages (`/`, `/login`, `/register`) get no layout change at all

- Decision: `authenticated.vue` is opted into only by the three already-authenticated pages. `index.vue`, `login.vue`, and `register.vue` are left completely untouched, continuing to use Nuxt's implicit default (no `default.vue` layout exists, so they render with no wrapping chrome, exactly as today).
- Rationale: The spec's User Stories only ever describe navigating between already-authenticated sections (dashboard/subjects/tasks); showing "My Subjects"/"My Tasks"/"Log out" to a signed-out visitor on the login or register screen would be actively wrong (those links require a session, and "Log out" is meaningless pre-login). Route protection is already enforced independently by `app/middleware/auth.global.ts` regardless of which layout a page uses, so this is a presentation-only decision with no security implication either way.
- Alternatives considered: Create `app/layouts/default.vue` for public pages and have the three authenticated pages opt out — rejected as more files touched (three explicit opt-outs plus a new file) for the same end result as opting three pages in.

## Decision 3: Move "Log out" into `AppNav.vue`; remove it from `dashboard.vue`

- Decision: The persistent nav includes a "Log out" action (reusing `useAuth().logout()`, unchanged), and the dashboard's own inline Log out button is removed since it would otherwise be duplicated.
- Rationale: This closes a real, previously-unaddressed gap the spec's User Story 1 implies but doesn't say outright: today, logging out is *only* possible from the dashboard — a student on `/subjects` or `/tasks` has no way to log out without first navigating back. A persistent nav is the natural, low-risk place to fix this (same composable, same redirect-to-`/login` behavior, just reachable from anywhere) rather than leaving it as a known follow-up gap.
- Alternatives considered: Leave "Log out" only on the dashboard and only add subjects/tasks links to the nav — rejected; it would ship a "persistent navigation" that still can't do one of the four things every authenticated page should be able to do (get back to the dashboard, see subjects, see tasks, sign out), for no reason once the nav component already exists.

## Decision 4: Active-section highlighting via `useRoute()`, not `NuxtLink`'s built-in `active-class`

- Decision: `AppNav.vue` computes the active link by comparing `useRoute().path` against each nav entry's target path directly (e.g., `route.path === '/subjects'`), rather than relying on `<NuxtLink>`'s automatic `router-link-active`/`router-link-exact-active` classes.
- Rationale: `router-link-active` matches by path-prefix by default (not exact), which would incorrectly mark "My Subjects" as active while viewing a hypothetical future `/subjects/:id` detail route, and marks `/` as always-active-adjacent to everything under it in some router configurations — an explicit, direct string comparison against `route.path` is simpler to read, has no such edge cases, and needs no Vue Router configuration knowledge to verify correct by inspection.
- Alternatives considered: `<NuxtLink active-class="...">` with `exact` matching — rejected as marginally more "framework magic" for zero behavioral gain over a one-line computed comparison, for a nav with only three fixed destinations.

## Decision 5: E2E-only test coverage; no new Vue component unit tests

- Decision: Validate this feature exclusively through a new Playwright spec (`tests/e2e/navigation.spec.ts`), not through isolated component-level unit tests of `AppNav.vue`.
- Rationale: This codebase has never used `@vue/test-utils` or any component-mount testing pattern — every UI-facing HU (US07's filter/sort controls, US08's recommendation widget) was validated end-to-end via Playwright instead, and introducing a net-new testing pattern for one small nav component would be inconsistent with established project convention for no proportionate benefit; E2E coverage exercises the real routing/layout integration this feature is actually about, which a component-level mount test would have to fake anyway.
- Alternatives considered: Add `@vue/test-utils` as a new dev dependency for a component-level test — rejected as introducing a new testing pattern and a new dependency (against the Simplicity constitution principle) to test something Playwright already covers naturally and more realistically.

## Decision 6: `app/app.vue` must wrap `<NuxtPage />` in `<NuxtLayout>`

- Decision: Add `<NuxtLayout>` around `<NuxtPage />` in `app/app.vue`, which previously rendered `<NuxtPage />` directly.
- Rationale: Discovered during implementation validation (E2E run) — Nuxt's layout system is completely inert unless the root `app.vue` renders `<NuxtPage />` inside `<NuxtLayout>`; without it, `definePageMeta({ layout: 'authenticated' })` on a page is silently ignored (Nuxt emits a dev-only `NUXT_E4007` console warning, easy to miss). Because `app/layouts/` was empty until this feature (Decision 1), `app.vue` never needed this wrapper before. Its absence caused every authenticated page to render with no nav at all, which surfaced as a full auth/navigation E2E regression (11 failing tests) rather than a build or type error, since Vue silently renders the page content without the surrounding layout.
- Alternatives considered: None — this is a required wiring step for Nuxt's layout system, not a design choice.
