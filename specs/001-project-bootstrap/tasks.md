# Tasks: Project Bootstrap

**Input**: Design documents from `/specs/001-project-bootstrap/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the project structure and baseline tooling needed before implementation begins.

- [ ] T001 Create repository scaffold and contribution layout in README.md, .env.example, app/, server/, shared/, tests/, and package.json
- [x] T002 [P] Initialize the Nuxt 4 + TypeScript project and install base dependencies in package.json, nuxt.config.ts, and lockfile
- [x] T003 [P] Configure linting, formatting, and TypeScript project settings in package.json, tsconfig.json, and eslint.config.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the core infrastructure required before any story can be implemented.

- [ ] T004 Create shared validation and type foundations in shared/types/*.ts and shared/schemas/*.ts
- [ ] T005 [P] Configure environment management and secure local configuration in .env.example, server/utils/env.ts, and README.md
- [ ] T006 [P] Create the app and server base structure with routing and middleware foundations in app/app.vue, app/layouts/default.vue, app/middleware/, and server/middleware/
- [x] T007 Configure automated testing baselines and workspace commands in package.json, vitest.config.ts, playwright.config.ts, and tests/
- [ ] T008 Establish error handling and runtime conventions in server/utils/, app/utils/, and README.md
- [ ] T009 Create contributor onboarding and local validation instructions in README.md and quickstart.md

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Contributor onboarding and local startup (Priority: P1) 🎯 MVP

**Goal**: A new contributor can clone the repository and run the application locally with the documented, shared setup.

**Independent Test**: Run install + local startup + basic health validation from a fresh clone without undocumented steps.

### Implementation for User Story 1

- [ ] T010 [P] [US1] Document the setup flow and required environment variables in README.md and .env.example
- [ ] T011 [US1] Create the default app shell and landing page structure in app/app.vue, app/layouts/default.vue, and app/pages/index.vue
- [x] T012 [US1] Add a minimal server health endpoint in server/api/health.get.ts to confirm the backend is running
- [ ] T013 [US1] Validate developer startup commands and local workflow in package.json and quickstart.md

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Shared technical standards and validation (Priority: P1)

**Goal**: Every contributor uses the same validation, testing, and code-quality conventions across the project.

**Independent Test**: Run linting, type checking, and automated tests with the documented project commands and confirm consistent results.

### Implementation for User Story 2

- [ ] T014 [P] [US2] Add shared validation rules and schema helpers in shared/schemas/*.ts and shared/types/*.ts
- [ ] T015 [P] [US2] Set up unit and integration test structure in tests/unit/, tests/integration/, and vitest.config.ts
- [ ] T016 [US2] Add Playwright smoke-test baseline and browser configuration in playwright.config.ts and tests/e2e/
- [ ] T017 [US2] Standardize validation commands and release gates in package.json, README.md, and quickstart.md

**Checkpoint**: At this point, User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Production build and deployability (Priority: P2)

**Goal**: The project can produce a successful production build and remain deployable with the default team workflow.

**Independent Test**: Run the production build in a clean environment and confirm the app exits with a successful build result.

### Implementation for User Story 3

- [ ] T018 [P] [US3] Configure production-safe app and server assets in nuxt.config.ts, app.config.ts, and package.json
- [ ] T019 [US3] Validate production build command output and required deployment assumptions in README.md and quickstart.md
- [ ] T020 [US3] Finalize release-readiness documentation and bootstrap verification checklist in README.md, quickstart.md, and specs/001-project-bootstrap/

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improve consistency and maintainability across all bootstrap work.

- [ ] T021 [P] Review repository conventions for naming, folder layout, and security hygiene across app/, server/, shared/, tests/, README.md, and .env.example
- [ ] T022 [P] Standardize documentation quality and onboarding clarity across README.md, quickstart.md, and the project bootstrap artifacts
- [x] T023 Run the full bootstrap validation sequence against the project quickstart and confirm that the foundation is ready for future user-story work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
- **Polish (Final Phase)**: Depends on all desired stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2; no dependencies on other stories
- **User Story 2 (P1)**: Can start after Phase 2; may run in parallel with US1
- **User Story 3 (P2)**: Can start after Phase 2; may run in parallel with US1 and US2 once the baseline is stable

### Parallel Opportunities

- T002 and T003 in Phase 1 can run in parallel
- T004, T005, T006, T007, T008, and T009 in Phase 2 can be split across contributors
- T010 with T011, T012, and T013 in US1 can run in parallel where file ownership does not conflict
- T014, T015, T016, and T017 in US2 can be implemented in parallel by different team members
- T018 and T019 in US3 can be split across validation and configuration tasks

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate startup flow and environment setup
5. Stop and confirm the project is usable by a new contributor

### Incremental Delivery

1. Setup + Foundational → shared project baseline
2. User Story 1 → local contributor onboarding and app startup
3. User Story 2 → quality baselines and validation conventions
4. User Story 3 → production-ready build and deployability
5. Polish → final consistency and contributor confidence

### Parallel Team Strategy

With a five-person team:

1. One contributor handles setup and scaffolding
2. One contributor configures validation and testing
3. One contributor handles app shell and server health foundations
4. One contributor validates build/deploy readiness
5. One contributor reviews documentation and team convention consistency

---

## Suggested MVP Scope

The recommended MVP for this technical foundation is User Story 1 only:

- repository onboarding and environment setup
- local running app
- minimal health validation
- contributor-ready documentation

This scope delivers immediate value while keeping the project stable enough for the broader foundation tasks to follow.

---

## Notes

- [P] tasks are intentionally independent and target different files or workflows
- Each story remains independently completable and testable
- The bootstrap intentionally excludes product user stories and keeps focus on architecture, tooling, and release readiness
- No task should assume a separate backend framework beyond the Nuxt/Nitro baseline required by the constitution
