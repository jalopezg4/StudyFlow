# Tasks: My Subjects and My Tasks Navigation & UX Polish

**Input**: Design documents from `/specs/009-nav-ux-polish/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Build the nav component and the layout that surfaces it. No user story is independently testable until this phase is complete.

- [X] T001 [P] Create `app/components/AppNav.vue`: three fixed links (Dashboard → `/dashboard`, My Subjects → `/subjects`, My Tasks → `/tasks`) using `useRoute().path` to determine and visually mark the active entry (research.md Decision 4), plus a "Log out" action calling the existing `useAuth().logout()` and redirecting to `/login` (research.md Decision 3) — styled consistently with the existing Tailwind patterns already used across `dashboard.vue`/`subjects/index.vue`/`tasks/index.vue`
- [X] T002 Create `app/layouts/authenticated.vue` rendering `<AppNav />` followed by `<slot />` (depends on T001; research.md Decision 1)
- [X] T002a Wrap `<NuxtPage />` in `<NuxtLayout>` in `app/app.vue` — required for Nuxt's layout system to activate at all; discovered during E2E validation (research.md Decision 6)

**Checkpoint**: The nav and its layout exist and render correctly in isolation; ready to wire into pages.

---

## Phase 2: User Story 1 - Find and open my subjects and tasks without creating something first (Priority: P1) 🎯 MVP

**Goal**: Every authenticated page shows a clearly labeled, persistent nav to Dashboard/My Subjects/My Tasks, landing directly on the existing list views with the active section visually indicated.

**Independent Test**: From any of the three authenticated pages, find and click "My Subjects" and separately "My Tasks", land on the existing list page with the student's own data, and confirm the active nav entry is visually distinct.

- [X] T003 [P] [US1] Add `definePageMeta({ layout: 'authenticated' })` to `app/pages/dashboard.vue`; remove its now-redundant inline "Log out" button (superseded by `AppNav`)
- [X] T004 [P] [US1] Add `definePageMeta({ layout: 'authenticated' })` to `app/pages/subjects/index.vue`; remove its "← Back to dashboard" link (superseded by `AppNav`'s Dashboard entry)
- [X] T005 [P] [US1] Add `definePageMeta({ layout: 'authenticated' })` to `app/pages/tasks/index.vue`; remove its "← Back to dashboard" link (superseded by `AppNav`'s Dashboard entry)
- [X] T006 [US1] Write `tests/e2e/navigation.spec.ts`: nav is present with all three links on `/dashboard`, `/subjects`, and `/tasks`; clicking "My Subjects"/"My Tasks" from each page lands on the correct existing list page showing the student's own data with no creation step in between; the active entry is visually distinct per page (depends on T001-T005)
- [X] T007 [US1] Confirm T006 passes against T001-T005

**Checkpoint**: A student can discover and reach their existing subjects/tasks from anywhere authenticated, with clear active-section feedback.

---

## Phase 3: User Story 2 - Consistent look and feel across the app's main sections (Priority: P2)

**Goal**: The nav (and therefore the surrounding chrome) looks and behaves identically across dashboard/subjects/tasks, and — closing a real prior gap — a student can log out from any of them, not just the dashboard.

**Independent Test**: From `/subjects` (not the dashboard), log out and confirm the session ends and the student lands on `/login`.

- [X] T008 [P] [US2] Add a case to `tests/e2e/navigation.spec.ts`: clicking "Log out" from `/subjects` (a non-dashboard page) ends the session and redirects to `/login`
- [X] T009 [US2] Confirm T008 passes

**Checkpoint**: Navigation chrome is consistent everywhere, and logging out no longer requires returning to the dashboard first.

---

## Phase 4: User Story 3 - Nothing that already works stops working (Priority: P1)

**Goal**: Every existing subject/task capability (create, edit, filter, sort, complete, delete, recommendation, ownership enforcement) still works exactly as before.

**Independent Test**: The full pre-existing automated suite (unit + E2E) passes unchanged.

- [X] T010 [US3] Run the full pre-existing automated suite (`tests/tasks/`, `tests/subjects/`, `tests/security/`, `tests/unit/`, and the existing `tests/e2e/` specs: `auth.spec.ts`, `tasks-filter-sort.spec.ts`, `tasks-recommendation.spec.ts`, `tasks-due-date-rules.spec.ts`) and confirm 100% pass unchanged, with no test modifications required by this feature

**Checkpoint**: All three user stories work independently and together — new navigation, consistent UX, zero regressions.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T011 Run all [quickstart.md](quickstart.md) validation scenarios and record results
- [X] T012 Run full standard validation commands (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run build`) and record evidence in this file

---

## Notes

- No server-side changes anywhere in this feature — no new route, schema, migration, or validation rule (plan.md Constraints).
- `SubjectList.vue`/`TaskList.vue` and their own scripts are not modified — only the pages' wrapping template (layout opt-in, removal of now-redundant links).
- Public pages (`/`, `/login`, `/register`) are untouched (research.md Decision 2).
- Implementation surfaced one required fix outside the original file list: `app/app.vue` needed `<NuxtLayout>` wrapping `<NuxtPage />` for the layout system to activate at all (T002a, research.md Decision 6) — without it, `authenticated.vue` was silently never applied.

## Validation Evidence

- `npm run lint`: 0 errors, 1 pre-existing warning (`PasswordInput.vue`, unrelated to this feature).
- `npm run typecheck`: clean, no errors.
- `npm run test`: 230/230 unit tests passed (24 files).
- `npm run test:e2e`: 34/34 passed across chromium + firefox on final run (an earlier run had 2 firefox failures — both stuck on `/register` before any nav code runs, matching this repo's known shared-Supabase-test-project rate-limit flakiness noted in `playwright.config.ts`; isolated rerun of both confirmed 11/11 pass, i.e. flaky infra, not a regression).
- `npm run build`: production build succeeds, no errors.
- Quickstart scenarios 1-3 manually walked via the E2E runs above: nav present/reachable on all three pages, active-state highlighting correct, log out works from `/subjects`, and the full pre-existing suite (auth, filter/sort, recommendation, due-date rules) passes unchanged.
