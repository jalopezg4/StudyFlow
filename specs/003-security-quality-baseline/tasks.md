# Tasks: Security and Quality Baseline

**Input**: Design documents from `/specs/003-security-quality-baseline/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare security baseline scaffolding and documentation locations.

- [x] T001 Create TECH-03 security baseline documentation scaffold in specs/003-security-quality-baseline/ and confirm traceability links
- [x] T002 [P] Verify environment-template and ignore-file secret protections in .env.example and .gitignore

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish reusable security primitives required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Create authenticated principal type definitions and shared ownership types in server/utils/security/types.ts
- [x] T004 [P] Implement server-side authentication guard conventions in server/utils/security/auth.ts
- [x] T005 [P] Implement ownership authorization guard conventions in server/utils/security/authorization.ts
- [x] T006 [P] Implement Zod request-boundary validation helpers in server/utils/security/validation.ts
- [x] T007 Implement safe error envelope and sanitization helpers in server/utils/security/errors.ts
- [x] T008 Create reusable baseline schemas for route params, query, and representative body payloads in server/utils/security/schemas.ts
- [x] T009 Document Supabase ownership and RLS strategy for user-owned tables in docs/security/rls-strategy.md

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Secure Server Request Boundaries (Priority: P1) 🎯 MVP

**Goal**: Protected server operations apply consistent server-side authentication, authorization, validation, and safe error behavior.

**Independent Test**: Security baseline tests verify unauthenticated rejection, unauthorized rejection, invalid-input rejection, and sanitized error responses.

### Implementation for User Story 1

- [x] T010 [P] [US1] Add representative protected baseline endpoint using shared helpers in server/api/security/baseline-owned-resource.get.ts
- [x] T011 [P] [US1] Add representative protected mutation-style endpoint with body and query validation in server/api/security/baseline-owned-resource.post.ts
- [x] T012 [US1] Add route-level safe error handling integration for baseline endpoints in server/api/security/_shared.ts
- [x] T013 [US1] Add security baseline test fixtures for principal context and ownership mismatch scenarios in tests/security/fixtures.ts
- [x] T014 [US1] Add tests for unauthenticated and unauthorized request rejection behavior in tests/security/authz-baseline.spec.ts
- [x] T015 [US1] Add tests for body/params/query invalid-input rejection behavior in tests/security/validation-baseline.spec.ts
- [x] T016 [US1] Add tests ensuring sanitized safe error envelopes do not leak internals in tests/security/error-safety.spec.ts

**Checkpoint**: User Story 1 is functional and independently testable.

---

## Phase 4: User Story 2 - Security Guardrails for Team Delivery (Priority: P1)

**Goal**: Team-wide documentation and repository configurations enforce security expectations for secrets, dependency monitoring, and PR review.

**Independent Test**: Contributors can follow documented security process and use repository templates/configuration in pull requests.

### Implementation for User Story 2

- [x] T017 [P] [US2] Create project SECURITY.md with responsible disclosure and contributor security expectations in SECURITY.md
- [x] T018 [P] [US2] Add Dependabot baseline configuration for npm and GitHub Actions in .github/dependabot.yml
- [x] T019 [US2] Add pull request security review checklist template in .github/pull_request_template.md
- [x] T020 [US2] Update README with security baseline references and contributor usage guidance in README.md
- [x] T021 [US2] Update TECH-03 quickstart validation flow to include documentation and config checks in specs/003-security-quality-baseline/quickstart.md

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Reusable Security Baseline for Future HUs (Priority: P2)

**Goal**: Future HUs can apply standardized security helpers, conventions, and tests without re-inventing guardrails.

**Independent Test**: A developer can implement a new protected route by following shared conventions and test patterns.

### Implementation for User Story 3

- [x] T022 [P] [US3] Add reusable server security usage guide for future HUs in docs/security/server-security-conventions.md
- [x] T023 [P] [US3] Add testing conventions for future protected route behavior in docs/security/testing-baseline.md
- [x] T024 [US3] Add a reusable baseline endpoint template for future features in server/api/security/_template-protected-handler.ts
- [x] T025 [US3] Document traceability mapping from TECH-03 requirements to implementation and tests in specs/003-security-quality-baseline/contracts/security-baseline-contract.md

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency and validation across implementation, docs, and quality gates.

- [x] T026 [P] Ensure .env.example and .gitignore remain secret-safe and aligned with SECURITY.md guidance in .env.example and .gitignore
- [x] T027 [P] Review CI security gate alignment (Snyk + dependency monitoring) for non-duplication and clarity in .github/workflows/ci.yml and .github/dependabot.yml
- [x] T028 Update TECH-03 task checkboxes, acceptance-criteria evidence notes, and final documentation consistency in specs/003-security-quality-baseline/tasks.md and specs/003-security-quality-baseline/quickstart.md
- [x] T029 Run full validation commands and confirm passing results (`npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational completion; no dependency on other stories
- **User Story 2 (P1)**: Starts after Foundational completion; independent of US1 implementation internals
- **User Story 3 (P2)**: Starts after Foundational completion; references completed baseline conventions from US1/US2

### Parallel Opportunities

- T004, T005, T006 can run in parallel after T003
- T010 and T011 can run in parallel
- T017 and T018 can run in parallel
- T022 and T023 can run in parallel
- T026 and T027 can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate baseline security behavior tests
4. Confirm secure boundary conventions are reusable

### Incremental Delivery

1. Build reusable primitives (authN/authZ/validation/errors)
2. Add representative endpoints + security tests
3. Add repository guardrails and docs
4. Add future-HU reuse guides and templates
5. Run full validation and finalize traceability

---

## Notes

- No TECH-03 task should implement product-level domain functionality.
- Security behavior must be server-side and testable.
- CI/CD strategy from TECH-02 remains in place and must not be replaced.
- Task checkboxes are marked only after implementation and validation evidence exists.

## Validation Evidence

- `npm run lint`: passed.
- `npm run typecheck`: passed (run with `NUXT_TELEMETRY_DISABLED=1` to avoid interactive telemetry prompt).
- `npm run test`: passed (4 files, 9 tests).
- `npm run build`: passed.
- `npm ci`: installation step repeatedly reached `nuxt prepare` in this terminal session; deterministic install was validated with `npm ci --ignore-scripts` followed by `npm run postinstall`.
