# Tasks: US13 Connect Views Instead of Making Students Hunt

**Input**: Design documents from `/specs/012-us13-connect-views/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks grouped by user story and branch scope.

## Phase 1: Setup

- [x] T001 Validate baseline on fresh branch from main (`npm run lint`, `npm run typecheck`)

---

## Phase 2: User Story 1 - Subject inline tasks (P1)

**Goal**: Add AC04 subject row toggle that opens subject tasks inline.

**Independent Test**: Expand and collapse subject row to view subject-scoped tasks without route change.

- [x] T002 [US1] Add View tasks/Hide tasks toggle in [app/components/subjects/SubjectList.vue](app/components/subjects/SubjectList.vue)
- [x] T003 [US1] Load subject-inline tasks with existing `GET /api/tasks?subjectId=...` in [app/components/subjects/SubjectList.vue](app/components/subjects/SubjectList.vue)
- [x] T004 [US1] Add loading/error/retry/empty UI states for inline subject tasks in [app/components/subjects/SubjectList.vue](app/components/subjects/SubjectList.vue)

---

## Phase 3: User Story 2 - Actionable recommendation (P1)

**Goal**: Add AC05 direct completion action in recommendation card.

**Independent Test**: Mark recommended task complete and verify refreshed recommendation.

- [x] T005 [US2] Add Mark complete action using existing `PATCH /api/tasks/:id` in [app/components/tasks/RecommendedTask.vue](app/components/tasks/RecommendedTask.vue)
- [x] T006 [US2] Refresh recommendation after successful completion in [app/components/tasks/RecommendedTask.vue](app/components/tasks/RecommendedTask.vue)

---

## Phase 4: User Story 3 - Recommendation explanation (P2)

**Goal**: Explain why the recommended task was selected.

**Independent Test**: Verify explanation differs for due-date vs no-due-date cases.

- [x] T007 [US3] Add reason text derived from returned task data in [app/components/tasks/RecommendedTask.vue](app/components/tasks/RecommendedTask.vue)

---

## Phase 5: Validation and CI

- [x] T008 Run `npm run lint` and fix only new issues from this feature
- [x] T009 Run `npm run typecheck`
- [x] T010 Run `npm run test:unit`
- [x] T011 Run `npm run build`
- [x] T012 Update this tasks file with validation evidence and completed state

---

## Dependencies & Execution Order

- T001 before all implementation tasks.
- T002-T004 before T008.
- T005-T007 before T008.
- T008-T011 before T012.

## Out of Scope in This Branch

- AC01 Study Sessions nav link
- AC02 dashboard quick-link relabeling
- AC03 task filters clear action

## Validation Evidence

- `npm run lint`: 0 errors, 1 pre-existing warning in `app/components/PasswordInput.vue`.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed (30 files, 264 tests).
- `npm run build`: passed.
