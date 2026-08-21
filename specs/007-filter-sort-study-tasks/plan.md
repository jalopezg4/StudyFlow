# Implementation Plan: Filter and Sort Study Tasks

**Branch**: `007-filter-sort-study-tasks` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-filter-sort-study-tasks/spec.md`

## Summary

Implement US07 (filter/sort a student's own study task listing) as a query-parameter extension of the existing HU06 `GET /api/tasks` route, with no new routes, tables, or columns. Supported filters (`status`, `subjectId`) and sort criteria (`dueDate`, `createdAt`, `title` × `asc`/`desc`) are validated against an explicit Zod allow-list schema *before* any database access; any unsupported or malformed value rejects the whole request with a validation error and zero data access. `listStudyTasksForOwner` in `server/utils/tasks/repository.ts` gains optional `filter`/`sort` parameters that translate 1:1 into `.eq()` and `.order()` calls built exclusively from the validated, allow-listed values — never from raw client input — with a deterministic `id` tiebreaker appended to every sort. Subject-filter ownership is enforced for free by the existing `user_id` scoping (a task's `subject_id`, for tasks owned by the requesting user, can only be a subject that same user owns, per HU05's creation-time ownership check), so filtering by another student's subject naturally yields an empty result without a separate lookup or an existence-revealing error.

## Technical Context

**Language/Version**: TypeScript 5.9.x on Nuxt 4 / Node.js 22+ (unchanged)

**Primary Dependencies**: Nuxt 4, Nitro server routes, Vue 3, Zod, `@supabase/supabase-js`, existing `server/utils/security/*` baseline (`requireAuthenticatedPrincipal`, `requireRequestSupabaseClient`, `createSafeHttpError`). No new runtime dependencies.

**Storage**: Supabase PostgreSQL. No schema, column, or RLS policy changes — reuses the `study_tasks` table and its existing `SELECT` policy exactly as HU06 left it; this feature only narrows/orders the query built against it.

**Testing**: Vitest, following the exact repository/route-level pattern established in `tests/tasks/` (HU05/HU06): schema validation (accepted/rejected filter+sort combinations), repository-level filter/sort/tiebreaker behavior, and route-level ownership + rejection-without-partial-execution cases. Playwright E2E remains deferred, consistent with every prior HU in this codebase.

**Target Platform**: Nuxt full-stack web app deployed via Vercel; Supabase-hosted PostgreSQL. Unchanged.

**Project Type**: Web application — single Nuxt project, no new services. Unchanged.

**Performance Goals**: Not performance-sensitive; still a single indexed-by-owner query with additional equality/order clauses.

**Constraints**: Must validate every filter/sort query parameter against an explicit allow-list before any database access (FR-007/FR-008/FR-013); must never let a filter/sort value influence SQL construction unless it passed that allow-list; must not add a client-supplied owner/user identifier; must not distinguish "subject not yours" from "subject doesn't exist" (empty result either way, per FR-009); must preserve HU06's existing no-params default listing behavior unchanged (FR-011); sort ties must resolve deterministically on repeated identical requests (FR-012).

**Scale/Scope**: One extended route (`GET /api/tasks` gains query-string handling), one extended repository function (`listStudyTasksForOwner`), one new query-schema module, no new UI components required for the acceptance criteria (filter/sort controls on `/tasks` are a natural but not spec-mandated follow-up — see Assumptions below).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Specification-First Development — rooted in `specs/007-filter-sort-study-tasks/spec.md` (US07).
- Pass: Nuxt-Native and Type-Safe Architecture — Nuxt/Nitro/Vue/TypeScript only; no new dependency.
- Pass: Security by Default — ownership stays enforced via the same server-derived `user_id` scoping HU06 established; filter/sort parameters never reach query construction unless they pass an explicit allow-list; unauthenticated requests are rejected by the existing `requireAuthenticatedPrincipal` guard before any filter/sort logic runs.
- Pass: Validation and Automated Quality — all filter/sort query parameters validated with a new Zod schema (allow-listed enums, no free-form strings reaching `.order()`/`.eq()`); automated Vitest coverage required for all four user stories (filter, sort, rejection, combination) before merge.
- Pass: Simplicity, Traceability and Deployability — single Nuxt project, no new services, no new tables, no new routes; extends one existing route and one existing repository function; traceable to the US07 GitHub Issue and this spec/plan.

No constitution violations require exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/007-filter-sort-study-tasks/
├── plan.md                                    # This file
├── research.md                                # Phase 0 output
├── data-model.md                              # Phase 1 output
├── quickstart.md                              # Phase 1 output
├── contracts/
│   └── study-task-filter-sort-contract.md     # Phase 1 output
└── tasks.md                                   # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
server/
├── api/
│   └── tasks/
│       └── index.get.ts            # Extended: parses/validates query params, passes filter+sort through
└── utils/
    └── tasks/
        ├── schemas.ts               # Extended: TaskListQuerySchema (status, subjectId, sortBy, sortDir allow-lists)
        └── repository.ts            # Extended: listStudyTasksForOwner(supabase, userId, filter?, sort?)

tests/
└── tasks/
    ├── schema.spec.ts               # Existing (HU05/HU06); extended with TaskListQuerySchema cases
    └── list-tasks.spec.ts           # Existing (HU06); extended with filter/sort/combination/rejection cases
```

**Structure Decision**: Pure extension of the existing single Nuxt project — no new directories. `GET /api/tasks` (`server/api/tasks/index.get.ts`) is the only route touched; it stays the single entry point for listing, now query-aware. All new validation logic lives in `server/utils/tasks/schemas.ts` next to the existing task schemas, and all new filter/sort query construction lives in the existing `listStudyTasksForOwner` in `server/utils/tasks/repository.ts`, mirroring how HU06 extended the same two files rather than introducing new ones. No UI components are added in this iteration (see Assumptions in spec.md); the JSON contract is exercised directly, matching how HU05/HU06 shipped their backend slice with UI arriving alongside via `TaskForm`/`TaskList` — filter/sort controls are additive UI work that can layer onto the existing `TaskList.vue` later without changing this contract.

## Complexity Tracking

No constitution violations or exception justifications identified.
