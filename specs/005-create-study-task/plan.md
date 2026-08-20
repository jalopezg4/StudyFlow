# Implementation Plan: Create Study Task

**Branch**: `005-create-study-task` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-create-study-task/spec.md`

## Summary

Implement HU05 (create a study task) as a single Nuxt/Nitro vertical slice: a `study_tasks` Supabase table protected by RLS and scoped to a subject the caller owns, a Zod-validated `POST /api/tasks` route that derives ownership exclusively from the server-resolved authenticated principal and verifies subject ownership before inserting, and a minimal creation form (subject picker, title, optional description/due date). Scope is intentionally limited to creation — listing, editing, status changes, and deleting tasks are HU06 (Manage Study Tasks). "Immediately retrievable" (SC-001, FR-012) is satisfied at the persistence/authorization layer (the row exists, is queryable by its owner, and is returned in the creation response); no dedicated listing page is built in this HU, mirroring the same scoping decision HU03 made for subjects.

## Technical Context

**Language/Version**: TypeScript 5.9.x on Nuxt 4 / Node.js 22+ (matches TECH-01/TECH-03 baseline)

**Primary Dependencies**: Nuxt 4, Nitro server routes, Vue 3, Zod, `@supabase/supabase-js` (already a dependency since HU03), the existing `server/utils/security/*` baseline (`requireAuthenticatedPrincipal`, `validateWithSchema`, `createSafeHttpError`/`sendSafeError`), and the existing `server/utils/subjects/repository.ts` (`getSubjectForOwner`, reused for the ownership check — not duplicated). Vitest, @nuxt/test-utils. No new package.json dependency is required.

**Storage**: Supabase PostgreSQL. New `study_tasks` table with RLS (see [data-model.md](data-model.md)), foreign-keyed to the existing `subjects` table without cascade delete (deleting a subject with tasks is already blocked by `specs/005-manage-subjects`'s deletion logic, which expects this exact FK shape).

**Testing**: Vitest for schema validation, route-handler behavior (US1-US3), and authorization/ownership tests, following the existing pattern in `tests/subjects/` (`createTestEvent` fixture, mocked repository). Playwright E2E is deferred for this HU, consistent with HU03's precedent — the primary risk surface (ownership, validation) is fully covered by fast unit/route-level tests.

**Target Platform**: Nuxt full-stack web app deployed via Vercel; Supabase-hosted PostgreSQL.

**Project Type**: Web application — single Nuxt project (no separate frontend/backend services), consistent with the constitution's "no separate backend framework" rule.

**Performance Goals**: Not performance-sensitive; a single-row insert per request (preceded by one ownership-check read) is expected to complete well under typical interactive-UI latency budgets.

**Constraints**: Must reuse the existing security baseline and the existing subjects repository rather than re-implement authentication, error handling, or subject-ownership lookups; must not accept a client-supplied owner identifier or initial `status`; RLS must be enabled on the new table; no new backend framework or service.

**Scale/Scope**: One table, one write endpoint, one form. Supports the same student population as the rest of the app; no unusual scale requirements.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Specification-First Development — rooted in `specs/005-create-study-task/spec.md` (HU05).
- Pass: Nuxt-Native and Type-Safe Architecture — Nuxt/Nitro/Vue/TypeScript only; no new dependency introduced.
- Pass: Security by Default — ownership derived server-side only from `requireAuthenticatedPrincipal`; subject ownership independently verified at the application layer and by RLS; RLS enforced on `study_tasks`; unauthenticated requests rejected before persistence.
- Pass: Validation and Automated Quality — all untrusted input validated with a Zod `CreateStudyTaskSchema`; automated Vitest coverage required for US1-US3 before merge.
- Pass: Simplicity, Traceability and Deployability — single Nuxt project, no new services; scope limited to creation to avoid speculative listing/edit/delete work (deferred to HU06); traceable to the HU05 GitHub Issue (#5) and this spec/plan.

No constitution violations require exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/005-create-study-task/
├── plan.md                                    # This file
├── research.md                                # Phase 0 output
├── data-model.md                              # Phase 1 output
├── quickstart.md                              # Phase 1 output
├── contracts/
│   └── study-task-creation-contract.md        # Phase 1 output
└── tasks.md                                   # Phase 2 output
```

### Source Code (repository root)

```text
app/
├── components/
│   └── tasks/
│       └── TaskForm.vue            # Subject picker + title/description/due-date fields, loading/success/error states
└── pages/
    └── tasks/
        └── index.vue                # Hosts TaskForm; renders success confirmation

server/
├── api/
│   └── tasks/
│       └── index.post.ts            # POST /api/tasks — auth -> validate -> verify subject ownership -> insert
└── utils/
    └── tasks/
        ├── schemas.ts                # CreateStudyTaskSchema (Zod)
        └── repository.ts             # Supabase insert for study_tasks, owner-scoped

supabase/
└── migrations/
    └── 20260819000000_create_study_tasks_table.sql   # Table + RLS policies

tests/
└── tasks/
    ├── schema.spec.ts               # CreateStudyTaskSchema unit tests (US3 rules)
    ├── create-task.spec.ts          # Route-level behavior for US1/US3 (mocked repositories)
    └── ownership.spec.ts            # US2 + unauthenticated rejection (mocked/unauthenticated event)
```

**Structure Decision**: Extend the existing single Nuxt project in place — no new package or service boundary. New task-specific code is grouped under `app/**/tasks/`, `server/**/tasks/`, and `tests/tasks/`, mirroring the existing `server/**/subjects/` grouping convention. `app/pages/tasks/index.vue` hosts only the creation form for this HU; a persisted listing/management view is explicitly deferred to HU06.

## Complexity Tracking

No constitution violations or exception justifications identified.
