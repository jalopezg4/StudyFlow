# Tasks: Subject Management

**Input**: Design documents from `/specs/004-subject-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Explicitly requested by the HU03 GitHub Issue subtasks ("Testing: crear materia correctamente", "rechazar nombre vacío", "Security test: usuario anónimo no puede crear materia") — included below, written before their corresponding implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new dependency this feature needs before any schema/handler work starts.

- [x] T001 Add `@supabase/supabase-js` to `package.json` dependencies (server-only usage; no browser bundle exposure)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core persistence and validation primitives that every user story's tests depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Create the `subjects` table migration (columns, length check constraints, RLS enabled, `subjects_select_own` + `subjects_insert_own` policies) in `supabase/migrations/20260818000000_create_subjects_table.sql` per [data-model.md](data-model.md)
- [x] T003 [P] Implement `CreateSubjectSchema` (Zod: `name` trimmed 1–100 chars required, `description` optional ≤500 chars, no owner/user-id field defined) in `server/utils/subjects/schemas.ts` (FR-002, FR-003, FR-004, FR-005, FR-007)
- [x] T004 [P] Implement `createSubject(userId, input)` repository function using a server-only Supabase client (service-role key) in `server/utils/subjects/repository.ts` (FR-006)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Create a subject to organize study work (Priority: P1) 🎯 MVP

**Goal**: An authenticated student can submit a name (and optional description) and see the subject persisted under their own account.

**Independent Test**: Submit a valid subject as an authenticated principal and verify it is stored, owned by that principal, and retrievable.

### Tests for User Story 1 ⚠️

> Write first; confirm they fail until T007 exists.

- [x] T005 [P] [US1] Write valid-creation tests (name only; name + description) asserting `201`, correct persisted `user_id`/`name`/`description` in `tests/subjects/create-subject.spec.ts`, using the `createTestEvent`-style authenticated fixture pattern from `tests/security/fixtures.ts` (CA01)

### Implementation for User Story 1

- [x] T006 [US1] Implement `POST /api/subjects` in `server/api/subjects/index.post.ts`, composing `requireAuthenticatedPrincipal` → `validateWithSchema(CreateSubjectSchema, ...)` → `createSubject` → `201` response, with `sendSafeError` for failures, per [contracts/subject-management-contract.md](contracts/subject-management-contract.md) (FR-001, FR-006, FR-009)
- [x] T007 [P] [US1] Build `SubjectForm.vue` (name + description fields, submit button, loading state) in `app/components/subjects/SubjectForm.vue`
- [x] T008 [US1] Build `app/pages/subjects/index.vue` hosting `SubjectForm`, showing a success confirmation after creation (depends on T007)
- [x] T009 [US1] Confirm T005 passes against T006

**Checkpoint**: User Story 1 is functional and independently testable — a student can create a subject end-to-end (backend verified by tests; frontend manually reviewable in `npm run dev`).

---

## Phase 4: User Story 2 - Be prevented from creating an invalid subject (Priority: P1)

**Goal**: Empty, whitespace-only, or over-length input is rejected with a clear validation error and nothing is persisted.

**Independent Test**: Attempt creation with an empty/too-long name (or too-long description) and verify a `422 VALIDATION_ERROR` with no persisted row.

### Tests for User Story 2 ⚠️

> Write first; confirm they fail until existing validation wiring from Phase 2/3 is exercised by these new cases.

- [x] T010 [P] [US2] Write `CreateSubjectSchema` unit tests: missing name, empty string, whitespace-only, name > 100 chars, description > 500 chars, and description omitted/empty (allowed) in `tests/subjects/schema.spec.ts` (CA02, FR-002–FR-005)
- [x] T011 [US2] Extend `tests/subjects/create-subject.spec.ts` with route-level cases asserting `422 VALIDATION_ERROR` and zero persisted rows for each invalid case above (depends on T005/T006 existing)

### Implementation for User Story 2

- [x] T012 [US2] Surface the API's `VALIDATION_ERROR` message/details as an inline error state in `SubjectForm.vue` (depends on T007/T008)
- [x] T013 [US2] Confirm T010/T011 pass

**Checkpoint**: User Stories 1 and 2 both work independently — invalid input never reaches persistence, and the UI communicates why.

---

## Phase 5: User Story 3 - Be blocked from creating subjects while unauthenticated (Priority: P1)

**Goal**: No subject can ever be created, or attributed to another student, without a valid authenticated session.

**Independent Test**: Issue a creation request with no authenticated principal and verify server rejection with no persisted row; issue one with a spoofed owner-like field and verify the persisted owner still matches the real principal.

### Tests for User Story 3 ⚠️

- [x] T014 [US3] Write unauthenticated-rejection test (`401 UNAUTHENTICATED`, zero persisted rows) in `tests/subjects/ownership.spec.ts`, mirroring `tests/security/authz-baseline.spec.ts` (CA03, FR-008)
- [x] T015 [US3] Write ownership-spoofing test: request body includes an extraneous `userId`/`ownerId`-like field alongside a valid name for principal A; assert the persisted row's `user_id` is principal A's id regardless (FR-007, FR-010) in `tests/subjects/ownership.spec.ts`

**Checkpoint**: All three user stories are independently functional. No additional production code is expected in this phase — T006's ordering (auth before validation before persistence) should already satisfy both tests; if either fails, fix `server/api/subjects/index.post.ts` before proceeding.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all three stories.

- [x] T016 [P] Add a cross-user isolation test (two distinct authenticated principals each create a subject; assert principal A's repository query never returns principal B's row) in `tests/subjects/ownership.spec.ts` (SC-005)
- [x] T017 Run all [quickstart.md](quickstart.md) validation scenarios and record results
- [x] T018 Run full standard validation commands (`npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) and record evidence in this file

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **User Stories (Phase 3–5)**: Depend on Foundational. US2 and US3 both extend the same handler and test files US1 creates (T006, T005's spec file), so in practice US1 should land first even though all three are P1.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational. Delivers the handler, form, and page every other story builds on.
- **User Story 2 (P1)**: Starts after Foundational; extends US1's handler behavior and test file with negative cases. Not independently deployable before US1 (there is nothing to reject creation *from* without US1's endpoint), but independently testable once US1 exists.
- **User Story 3 (P1)**: Starts after Foundational; adds a new test file exercising US1's handler. Same relationship as US2 — independently testable, not independently deployable before US1.

### Parallel Opportunities

- T003 and T004 can run in parallel after T002.
- T005 and T007 can run in parallel (different files).
- T010 can run in parallel with T007/T008 (different files).
- T014 and T015 can be authored together in the same new file but are logically independent cases.

---

## Parallel Example: Foundational + User Story 1

```bash
# After T002 (migration) lands:
Task: "Implement CreateSubjectSchema in server/utils/subjects/schemas.ts"
Task: "Implement createSubject repository function in server/utils/subjects/repository.ts"

# Once T006 (route handler) is implemented:
Task: "Write valid-creation tests in tests/subjects/create-subject.spec.ts"
Task: "Build SubjectForm.vue in app/components/subjects/SubjectForm.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (US1) — a student can create a subject end-to-end.
3. **STOP and VALIDATE**: run T005/T009; manually exercise the form in `npm run dev`.

### Incremental Delivery

1. Setup + Foundational → migration and validation/persistence primitives ready.
2. US1 → creation works end-to-end (MVP).
3. US2 → invalid input is provably rejected, UI explains why.
4. US3 → unauthenticated/spoofed-owner attempts are provably rejected.
5. Polish → cross-user isolation check, quickstart run, full validation commands.

---

## Notes

- No task in this HU implements listing, editing, or deleting subjects — those are separate future user stories (see [research.md](research.md) Decision 4).
- `user_id` must never be read from request input at any point in T006 — only from `requireAuthenticatedPrincipal(event)`.
- Mark a task's checkbox only after its tests (where applicable) pass.

## Validation Evidence

- `npm run lint`: passed.
- `npm run typecheck`: passed (run with `NUXT_TELEMETRY_DISABLED=1`).
- `npm run test`: passed (7 files, 33 tests — 24 in the three new `tests/subjects/*.spec.ts` files, 9 pre-existing security baseline tests unaffected).
- `npm run build`: passed; confirmed via the built Nitro route manifest that `POST /api/subjects` is registered correctly (chunk file naming under `.output/server/chunks/routes/api/` is generic and does not reflect the route path 1:1 — verified the actual `route: '/api/subjects', method: 'post'` entry instead).
- `npm ci`: hit the same Windows `EPERM`/file-lock issue on `@esbuild`/`@rollup` native binaries already documented in `specs/003-security-quality-baseline/tasks.md`; recovered with a plain `npm install` (package-lock.json unchanged by the recovery) and re-verified lint/test/build afterward.
- Manual smoke test against `npm run dev`: unauthenticated `POST /api/subjects` returned `401 UNAUTHENTICATED` with no persistence attempted (matches CA03 and the Dependency Risk design in plan.md).
- **Bug found and fixed during manual verification**: `app/app.vue` had no `<NuxtPage />` (it only had `<NuxtWelcome />`, since no pages existed before this feature). File-based routing was active once `app/pages/subjects/index.vue` was added, but nothing rendered the matched page — every route, including `/subjects`, silently served the generic Nuxt welcome screen, and `/` logged a `VUE_ROUTER_R0004` "no match" warning. An initial smoke test only checked the HTTP status code (200) and missed this. Fixed by switching `app.vue` to `<NuxtPage />` and adding a minimal `app/pages/index.vue` linking to `/subjects`. Re-verified by asserting response *body* content, not just status: `/` now contains "Crear materia" and `/subjects` now contains the actual `SubjectForm` markup. Lint/typecheck/test all re-passed after the fix.
- Not exercised in this environment (no live Supabase project configured): the actual migration SQL against a real Postgres instance, and RLS policy enforcement itself. `createSubject`/Supabase calls are mocked at the repository boundary in all automated tests — see research.md Decision 5 and quickstart.md's "Known Limitation" note.
- **Tailwind CSS wiring fixed (pre-existing TECH-01 gap, out of HU03's original scope but fixed here at explicit request)**: `tailwindcss@4.3.3` was installed with a v3-style `postcss.config.cjs`/`tailwind.config.cjs` that Nuxt 4 rejected outright (`NUXT_B5004`) and that don't apply to Tailwind v4 anyway (v4 moved PostCSS integration to `@tailwindcss/postcss`/`@tailwindcss/vite`). No CSS file ever imported Tailwind and `nuxt.config.ts` had no `css`/`vite.plugins` entry, so Tailwind was a no-op. Fixed by adding `@tailwindcss/vite@4.3.3`, `app/assets/css/main.css` (`@import "tailwindcss";`), registering both in `nuxt.config.ts`, and removing the two dead legacy config files. Migrated `SubjectForm.vue`, `app/pages/subjects/index.vue`, and `app/pages/index.vue` from scoped CSS to Tailwind utility classes. Verified the compiled build's CSS bundle contains real generated utility rules (e.g. `.bg-slate-900`, `.rounded-md`), the dev server log no longer emits `NUXT_B5004`, and rendered page bodies contain the applied classes. Lint/typecheck/test/build all re-passed after this change.
