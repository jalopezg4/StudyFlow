# Tasks: Authentication (Registration, Login, Logout & Route Protection)

**Input**: Design documents from `/specs/004-authentication/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 Registration, US2 Login, US3 Logout, US4 Route Protection)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prerequisites so any page can render and Supabase can be reached at all.

- [x] T001 Add `@supabase/supabase-js` (`^2.112.3`) and `@supabase/ssr` (`^0.12.4`) to package.json and install
- [x] T002 [P] Fix `app/app.vue` to render `<NuxtPage />` so pages under `app/pages/` are reachable
- [x] T003 [P] Fix Tailwind v4 setup via `@tailwindcss/vite` in nuxt.config.ts, removing the incompatible v3-style tailwind.config.cjs/postcss.config.cjs
- [x] T004 Confirm `.env.example` documents `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (already present — verified) and document local Supabase project setup (email confirmation disabled, min password length 8) in README.md and specs/004-authentication/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Session resolution and the request boundary every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Create Supabase browser client plugin using @supabase/ssr in app/plugins/supabase.client.ts
- [x] T006 Create `useAuth` composable wrapping signUp/signInWithPassword/signOut with generic error mapping in app/composables/useAuth.ts
- [x] T007 Create Register/Login Zod request schemas (email format, 8-char minimum password) in shared/utils/auth-schemas.ts — **deviation from plan**: placed in `shared/` (isomorphic, Nuxt 4's client+server auto-import directory) instead of `server/utils/security/schemas.ts`, because the client-side forms need the exact same schema for immediate validation, and `server/` code is not importable from `app/` code in Nuxt
- [x] T008 Implement server-side session resolution middleware (creates @supabase/ssr server client from request cookies, calls supabase.auth.getUser(), sets event.context.auth) in server/middleware/auth.ts — the `H3EventContext.auth` shape is declared globally in server/types/h3.d.ts, and the Supabase-user → auth-context mapping is factored into the testable server/utils/security/session.ts
- [x] T009 Implement server-side private-route enforcement (redirect unauthenticated requests to /login for private prefixes; redirect authenticated requests away from /login and /register to /dashboard) in server/middleware/auth.ts — the decision logic itself is factored into shared/utils/route-protection.ts (isomorphic) so the exact same rule is reused by the client-side middleware in T010, not duplicated
- [x] T010 [P] Add client-side route-protection middleware (UX-only defense-in-depth, never sole guard) in app/middleware/auth.global.ts (global, using the shared resolveRouteGuardAction from T009)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Account Registration (Priority: P1) 🎯 MVP

**Goal**: A visitor can create an account with email + password and immediately be able to log in.

**Independent Test**: Submit a valid, unused email and an 8+ character password on `/register` and observe account creation and success feedback; resubmitting the same email does not create a duplicate and shows a generic outcome.

### Implementation for User Story 1

- [x] T011 [US1] Build registration form (email, password, submit) with client-side Zod validation and loading/error/success states in app/pages/register.vue
- [x] T012 [US1] Wire registration form to `useAuth().register`, mapping Supabase "already registered" and other failures to a single generic message in app/pages/register.vue
- [x] T013 [P] [US1] Unit test RegisterRequestSchema (valid, invalid email, short password) in tests/unit/auth/schemas.spec.ts
- [x] T014 [P] [US1] Playwright test: successful registration and duplicate-email registration outcome in tests/e2e/auth.spec.ts

**Checkpoint**: User Story 1 is functional and independently testable.

---

## Phase 4: User Story 2 - Login (Priority: P1)

**Goal**: A student with an existing account can log in and reach the dashboard.

**Independent Test**: Submit correct credentials on `/login` and observe redirect to `/dashboard`; submit incorrect credentials and observe one generic error with no session started.

### Implementation for User Story 2

- [x] T015 [US2] Build login form (email, password, submit) with client-side Zod validation and loading/error states in app/pages/login.vue
- [x] T016 [US2] Wire login form to `useAuth().login`, redirect to /dashboard on success, single generic error message on failure in app/pages/login.vue
- [x] T017 [P] [US2] Unit test LoginRequestSchema in tests/unit/auth/schemas.spec.ts
- [x] T018 [P] [US2] Playwright test: successful login redirects to dashboard; wrong password shows generic error in tests/e2e/auth.spec.ts

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 4 - Private Route Protection (Priority: P1)

**Goal**: Private pages and their underlying data operations are unreachable without a valid session, server-side.

**Independent Test**: Open `/dashboard` directly with no session → redirected to `/login`; open it with a valid session → access granted; call a protected server route directly with no session → rejected.

### Implementation for User Story 4

- [x] T019 [US4] Build minimal dashboard placeholder page (welcome text, logout entry point) in app/pages/dashboard.vue
- [x] T020 [US4] Unit test Supabase-user → auth-context session resolution (valid user → context.auth set; missing user → context.auth absent) in tests/unit/auth/session-middleware.spec.ts — tests the extracted server/utils/security/session.ts directly rather than the Nitro-wired server/middleware/auth.ts entrypoint, consistent with how TECH-03 tests server/utils/security/* rather than the Nitro route handlers themselves
- [x] T021 [US4] Unit test route-protection redirect behavior (private path + no auth → redirect /login; auth path + authenticated → redirect /dashboard) in tests/unit/auth/route-protection.spec.ts
- [x] T022 [P] [US4] Playwright test: direct navigation to /dashboard without a session redirects to /login; with a session, access is granted in tests/e2e/auth.spec.ts

**Checkpoint**: User Stories 1, 2, and 4 all work independently.

---

## Phase 6: User Story 3 - Logout (Priority: P2)

**Goal**: An authenticated student can end their session and lose access to private pages immediately after.

**Independent Test**: Log in, trigger logout, observe redirect to `/login`; attempt to reopen `/dashboard` afterward and observe redirect back to `/login`.

### Implementation for User Story 3

- [x] T023 [US3] Add logout action/button on app/pages/dashboard.vue wired to `useAuth().logout`, redirecting to /login on completion
- [x] T024 [P] [US3] Playwright test: logout followed by an attempt to reopen /dashboard redirects to /login (covers CA01/CA02 of HU02) in tests/e2e/auth.spec.ts

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency and validation across implementation, docs, and quality gates.

- [x] T025 [P] Update README.md with local Supabase Auth setup steps for contributors (env vars, disabling email confirmation, min password length)
- [x] T026 [P] Review server/middleware/auth.ts and app pages for secret/token logging per SECURITY.md guidance (FR-011) — no `console.*` calls exist in any new file; verified via grep
- [x] T027 Update this file's task checkboxes and specs/004-authentication/quickstart.md with validation evidence
- [x] T028 Run full validation commands and confirm passing results (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`; see Validation Evidence — `npm run test:e2e` written but not executed in this environment)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Stories (Phase 3–6)**: Depend on Foundational completion
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 - Registration (P1)**: Starts after Foundational completion; no dependency on other stories
- **User Story 2 - Login (P1)**: Starts after Foundational completion; needs an account to exist to test end-to-end, so in practice runs after US1's Playwright fixture creates one, but has no code dependency on US1's implementation
- **User Story 4 - Route Protection (P1)**: Starts after Foundational completion (T008/T009 already implement the mechanism); the dashboard page it protects is built in this phase
- **User Story 3 - Logout (P2)**: Depends on US2 (needs a login flow to establish the session it ends) and US4 (needs the dashboard page to place the logout action on)

### Parallel Opportunities

- T002 and T003 can run in parallel after T001
- T013 and T014 can run in parallel (after T011/T012)
- T017 and T018 can run in parallel (after T015/T016)
- T022 can run in parallel with T020/T021 once T019 exists
- T024 can run in parallel with T025/T026

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1 — Registration)
3. Validate an account can be created and the session mechanism (Phase 2) recognizes it

### Incremental Delivery

1. Setup + Foundational (session middleware, route protection, Supabase wiring)
2. US1 Registration → US2 Login → US4 Route Protection (all P1, deliverable in this order)
3. US3 Logout (P2, closes the loop once login + dashboard exist)
4. Polish: docs, secret-safety review, full validation suite

---

## Notes

- No task in this feature re-implements `server/utils/security/*` from TECH-03; it is reused as-is.
- Route protection must be verified server-side, not only via the client-side middleware (Constitution Principle III).
- Task checkboxes are marked only after implementation and validation evidence exists.
- Two deviations from the original file-path plan (documented inline above, T007 and T008/T009): schema and route-guard logic moved into `shared/utils/` so the exact same code is reused by both the client forms and the server middleware, instead of duplicating rules in two places.

## Validation Evidence

- `npm run test` (Vitest): **passed** — 7 files, 24 tests (includes 3 new auth test files: schemas, route-protection, session-middleware).
- `npm run typecheck` (`nuxt typecheck`): **passed**, no errors (required `NODE_OPTIONS=--max-old-space-size=6144` in this sandboxed environment to avoid an out-of-memory crash unrelated to this feature's code).
- `npm run lint` (ESLint): **passed**, no errors or warnings.
- `npm run build` (`nuxt build`): **passed**, production output generated successfully in `.output/`.
- `npm run test:e2e` (Playwright): **written, not executed in this environment** — `npx playwright install chromium` failed with `ENOSPC` (no disk space left) in this sandbox. The 6 scenarios in `tests/e2e/auth.spec.ts` were instead verified **manually against the real Supabase project**, driving the production build (`node -r dotenv/config .output/server/index.mjs`) through a real browser:
  - Register → success message → CA01 ✅
  - Login with correct credentials → redirected to `/dashboard` → CA02 ✅
  - Login with incorrect password → generic "Incorrect email or password." → CA03 ✅
  - Already-authenticated visit to `/login` → redirected to `/dashboard` → FR-015 ✅
  - Logout → redirected to `/login` → US3 CA01 ✅
  - Direct navigation to `/dashboard` after logout → redirected to `/login` → US3 CA02 / US4 CA01 ✅
  - Follow-up recommendation: run `npm run test:e2e` on a machine/CI runner with disk space and Supabase test-project secrets configured, to get these scenarios under automated regression coverage.
