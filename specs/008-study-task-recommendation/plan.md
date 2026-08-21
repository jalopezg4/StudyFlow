# Implementation Plan: Study Task Recommendation

**Branch**: `008-study-task-recommendation` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-study-task-recommendation/spec.md`

## Summary

Implement US08 (recommend the single highest-priority study task) as one new read-only route, `GET /api/tasks/recommendation`, built on the exact same security baseline and Study Task entity as HU05/HU06/HU07 — no new table, no new columns, no new RLS policy, no new Zod schema (the route takes no request body or query parameters). A new repository function, `getRecommendedTaskForOwner`, issues a single owner-scoped, `status = 'pending'` query ordered by `due_date` ascending (PostgreSQL's own `NULLS LAST` default naturally deprioritizes undated tasks — the exact behavior the spec's Clarifications session settled on), then `created_at` ascending, then `id` ascending as a final deterministic tiebreak, and returns the first row or `null`. The route always responds `200 OK` with `{ status: 'ok', task: StudyTask | null }` — a `null` task is the empty-state result (FR-004), never an error.

## Technical Context

**Language/Version**: TypeScript 5.9.x on Nuxt 4 / Node.js 22+ (unchanged)

**Primary Dependencies**: Nuxt 4, Nitro server routes, Vue 3, `@supabase/supabase-js`, existing `server/utils/security/*` baseline (`requireAuthenticatedPrincipal`, `requireRequestSupabaseClient`). No new runtime dependencies, no Zod schema needed (no request input to validate).

**Storage**: Supabase PostgreSQL. No schema, column, or RLS policy changes — reuses the `study_tasks` table and its existing `SELECT` policy exactly as HU06/HU07 left it; this feature only adds a new query shape (owner + status filter, three-key sort, limit 1) against it.

**Testing**: Vitest, following the two-layer pattern established in HU07 (`tests/tasks/`): a repository-level suite against an in-memory fake Supabase query builder (proves the actual ordering/tiebreak/exclusion logic, not just that a mock was called correctly) plus a route-level suite with the repository mocked (proves auth-before-data-access and the response envelope, including the empty-state case). Playwright E2E remains Firefox-only per the known Chromium session bug tracked from HU07's CI work; a small UI touchpoint is not spec-mandated here (see Assumptions) so no new E2E spec is required by this plan, though one may be added quickly afterward the same way HU07's was, if requested.

**Target Platform**: Nuxt full-stack web app deployed via Vercel; Supabase-hosted PostgreSQL. Unchanged.

**Project Type**: Web application — single Nuxt project, no new services. Unchanged.

**Performance Goals**: Not performance-sensitive; a single indexed-by-owner, filtered, sorted, `LIMIT 1` query.

**Constraints**: Must not introduce a parallel/duplicate task model, table, or route family (FR-008); must not use an LLM/AI/ML service to pick the recommendation (FR-009) — the algorithm is the fixed rule in spec.md's Prioritization Rule section, nothing else; must restrict every recommendation to the requester's own tasks via the same server-derived `user_id` scoping already established (FR-005); must reject unauthenticated requests before any task is evaluated (FR-006); must never mutate data (FR-007); must produce the identical recommendation on repeated identical requests against unchanged data, including ties (FR-003, SC-002).

**Scale/Scope**: One new route (`GET /api/tasks/recommendation`), one new repository function (`getRecommendedTaskForOwner`), no new schema module, no migration.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Specification-First Development — rooted in `specs/008-study-task-recommendation/spec.md` (US08), including a resolved `/speckit-clarify` session on the prioritization rule's handling of undated tasks.
- Pass: Nuxt-Native and Type-Safe Architecture — Nuxt/Nitro/TypeScript only; no new dependency, no ML/AI service.
- Pass: Security by Default — ownership enforced via the same server-derived `user_id` scoping HU05/HU06/HU07 established; unauthenticated requests rejected by `requireAuthenticatedPrincipal` before any task is evaluated; no client-supplied owner/user identifier anywhere in this route.
- Pass: Validation and Automated Quality — no untrusted input exists for this route (no body, no query params), so there is nothing to validate; automated Vitest coverage required for all three user stories (recommend, empty-state, isolation) before merge, at both the repository and route level.
- Pass: Simplicity, Traceability and Deployability — single Nuxt project, no new table, no new service, one new route and one new repository function; traceable to the US08 GitHub Issue and this spec/plan.

No constitution violations require exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/008-study-task-recommendation/
├── plan.md                                    # This file
├── research.md                                # Phase 0 output
├── data-model.md                              # Phase 1 output
├── quickstart.md                              # Phase 1 output
├── contracts/
│   └── study-task-recommendation-contract.md  # Phase 1 output
└── tasks.md                                   # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
server/
├── api/
│   └── tasks/
│       └── recommendation.get.ts   # New: GET /api/tasks/recommendation
└── utils/
    └── tasks/
        └── repository.ts           # Extended: getRecommendedTaskForOwner(supabase, userId)

tests/
└── tasks/
    ├── recommendation-repository.spec.ts   # New: real ordering/tiebreak/exclusion behavior
    └── recommendation.spec.ts              # New: route-level auth/response-envelope behavior
```

**Structure Decision**: Pure extension of the existing single Nuxt project — no new directories, no new schema module (this route has no request input to validate). `recommendation.get.ts` sits alongside the existing `[id].get.ts`/`index.get.ts`/etc. under `server/api/tasks/`; Nitro resolves the literal path segment `recommendation` ahead of the dynamic `[id]` route, so no routing ambiguity exists between `GET /api/tasks/recommendation` and `GET /api/tasks/:id`. `getRecommendedTaskForOwner` is added to the same `server/utils/tasks/repository.ts` module as every other task query, reusing its `TASK_COLUMNS`/`toStudyTask` mapping, mirroring how HU07 extended `listStudyTasksForOwner` in place rather than introducing a new repository file.

## Complexity Tracking

No constitution violations or exception justifications identified.
