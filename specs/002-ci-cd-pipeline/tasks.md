# Tasks: CI/CD Pipeline

**Input**: Design documents from `/specs/002-ci-cd-pipeline/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared CI/CD workflow scaffolding and contributor-facing baseline documentation

- [x] T001 [P] Create the GitHub Actions workflow scaffold in .github/workflows/ci.yml
- [x] T002 [P] Document CI/CD prerequisites, secret handling, and Vercel/Snyk setup assumptions in README.md and specs/002-ci-cd-pipeline/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the workflow structure and shared gates that every user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Define the workflow trigger matrix for pull_request targeting main and push to main in .github/workflows/ci.yml
- [x] T004 [P] Add the repository checkout, Node setup, and npm ci install steps to .github/workflows/ci.yml
- [x] T005 [P] Add the validation job steps for npm run lint, npm run typecheck, npm run test, and npm run build in .github/workflows/ci.yml
- [x] T006 [P] Add the Snyk security scan stage with High and Critical blocking behavior in .github/workflows/ci.yml
- [x] T007 [P] Add the conditional E2E execution policy for main and selected pull requests in .github/workflows/ci.yml

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automated validation on pull requests and main pushes (Priority: P1) 🎯 MVP

**Goal**: Every pull request to main and every push to main is validated automatically before release readiness

**Independent Test**: Open a pull request targeting main or push a commit to main and confirm the workflow reports visible pass/fail status checks without manual execution

### Implementation for User Story 1

- [x] T008 [US1] Wire the pull_request trigger and required status-check names into .github/workflows/ci.yml
- [x] T009 [US1] Ensure the same validation path runs for push events to main in .github/workflows/ci.yml
- [x] T010 [US1] Update README.md with the contributor-facing validation flow and required checks for pull requests and main pushes

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Preview deployments for pull requests (Priority: P2)

**Goal**: Reviewers can inspect pull requests in preview environments provided through Vercel Git integration

**Independent Test**: Open or update a pull request and confirm a preview deployment is available without manual deployment steps

### Implementation for User Story 2

- [x] T011 [P] [US2] Document how preview deployments are created and reviewed through Vercel Git integration in README.md
- [x] T012 [US2] Add preview deployment verification steps and expected outcomes to specs/002-ci-cd-pipeline/quickstart.md
- [x] T013 [US2] Record preview deployment behavior and lifecycle expectations in specs/002-ci-cd-pipeline/contracts/ci-cd-workflow-contract.md

**Checkpoint**: At this point, User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Production deployment from main (Priority: P3)

**Goal**: Merges to main deploy to production automatically through Vercel Git integration

**Independent Test**: Merge an approved pull request into main and confirm the live production environment updates automatically

### Implementation for User Story 3

- [x] T014 [P] [US3] Document the main-branch production deployment flow and required Vercel Git integration settings in README.md
- [x] T015 [US3] Add merge-to-production validation steps and expected outcomes to specs/002-ci-cd-pipeline/quickstart.md
- [x] T016 [US3] Record production deployment expectations and release behavior in specs/002-ci-cd-pipeline/contracts/ci-cd-workflow-contract.md

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tighten wording, keep terminology consistent, and verify the documented workflow end to end

- [x] T017 [P] Align CI/CD terminology across README.md, specs/002-ci-cd-pipeline/quickstart.md, and specs/002-ci-cd-pipeline/contracts/ci-cd-workflow-contract.md
- [X] T018 Run the documented CI/CD validation walkthrough in specs/002-ci-cd-pipeline/quickstart.md and capture any final wording fixes in README.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May reference US1 documentation but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May reference US1/US2 documentation but should be independently testable

### Within Each User Story

- Shared workflow scaffolding before story-specific documentation
- Workflow triggers and validation gates before release-oriented behavior
- Documented validation before polish and cross-cutting cleanup

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel within Phase 2
- Once Foundational phase completes, all user stories can start in parallel if staffing allows
- All documentation tasks within a user story marked [P] can run in parallel
- Story-specific documentation can be drafted in parallel with implementation once the foundational workflow exists

---

## Parallel Example: User Story 1

```bash
# Launch all shared validation wiring tasks together:
Task: "Wire the pull_request trigger and required status-check names into .github/workflows/ci.yml"
Task: "Ensure the same validation path runs for push events to main in .github/workflows/ci.yml"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm pull request and main-push validation works independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → shared CI/CD baseline
2. Add User Story 1 → validate PRs and pushes to main → demonstrate required checks
3. Add User Story 2 → preview deployments via Vercel Git integration
4. Add User Story 3 → production deployment from main via Vercel Git integration
5. Finish with documentation polish and workflow walkthrough validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Avoid custom deployment services; use Vercel Git integration for previews and production
- Keep Snyk findings High/Critical blocking once the scanner is configured

## Validation Evidence

Closed retroactively on 2026-08-21 as part of a repo-wide spec/task traceability cleanup (see issue #35). Walkthrough against [quickstart.md](quickstart.md)'s 5 scenarios:

- **Scenario 1 (PR validation)**: Confirmed repeatedly across PRs #31-#34 — `Validate` (lint, typecheck, test, build, Snyk) and, where labeled, `E2E` show as required/visible status checks before merge.
- **Scenario 2 (Main branch validation)**: Confirmed — `push` events to `main` trigger the same `Validate` job (e.g. runs following #31-#33 merging).
- **Scenario 3 (Preview deployment)** and **Scenario 4 (Production deployment)**: **Not verified from this repository** — Vercel's Git integration is configured externally (no `vercel.json` or equivalent is versioned here), so preview/production deployment behavior can't be confirmed from code alone. Tracked as an open item in issue #35.
- **Scenario 5 (Security scanning)**: Confirmed — `SNYK_TOKEN` is configured, so the scan runs and gates the job (`--severity-threshold=high`); the "reports a skipped scan when `SNYK_TOKEN` is not configured" sub-case (step 4) was actually not yet implemented until now — fixed in #34, which added exactly that graceful-skip behavior.
- README.md wording (line 31-37) already accurately describes this — no wording fix was needed.
