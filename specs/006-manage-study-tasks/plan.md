# Implementation Plan: Manage Study Tasks

**Branch**: `006-manage-study-tasks` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-manage-study-tasks/spec.md`

## Summary

Implement HU06 (list, view, edit — including status changes — and delete a student's own study tasks) as a direct extension of the HU05 `study_tasks` vertical slice: four new Nitro routes (`GET /api/tasks`, `GET /api/tasks/:id`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`) built on the existing security baseline, new Supabase RLS `UPDATE`/`DELETE` policies mirroring the existing `SELECT`/`INSERT` policies, and a task listing view with inline edit and delete-with-confirmation, hosted alongside the existing `TaskForm`. Ownership and non-existence are treated identically at the response boundary (a single owner-scoped query, not "fetch then compare"), matching HU04's pattern for subjects exactly. No deletion dependency rule applies (see spec Clarifications) — deletion is unconditional once ownership is confirmed.

**Also retrofits `server/utils/tasks/repository.ts` to the request-scoped Supabase client** (`requireRequestSupabaseClient`) established by the RLS follow-up merged after HU05, replacing the service-role client `createStudyTask` still used. This was flagged as a known gap when HU05 merged (deferred pending that follow-up); HU06 is the natural point to complete it, since it touches the same file to add four more functions and leaving `createStudyTask` on the old pattern while its four new siblings use the new one would be an inconsistent, confusing mix within a single module.

## Technical Context

**Language/Version**: TypeScript 5.9.x on Nuxt 4 / Node.js 22+ (unchanged)

**Primary Dependencies**: Nuxt 4, Nitro server routes, Vue 3, Zod, `@supabase/supabase-js`, existing `server/utils/security/*` baseline (including `requireRequestSupabaseClient`). No new runtime dependencies.

**Storage**: Supabase PostgreSQL. Extends the existing `study_tasks` table (no schema/column changes) with new `UPDATE`/`DELETE` RLS policies (see [data-model.md](data-model.md)).

**Testing**: Vitest, following the exact route/repository-level pattern established in `tests/subjects/` (HU04) and `tests/tasks/` (HU05): listing, single-task detail retrieval and its cross-owner/nonexistent denial, update (including status transitions and validation rejection), and delete. Playwright E2E remains deferred, consistent with every prior HU in this codebase (no real coverage gain until the E2E CI environment issue tracked separately is resolved).

**Target Platform**: Nuxt full-stack web app deployed via Vercel; Supabase-hosted PostgreSQL. Unchanged.

**Project Type**: Web application — single Nuxt project, no new services. Unchanged.

**Performance Goals**: Not performance-sensitive; listing is a single indexed-by-owner query, update/delete are single-row operations.

**Constraints**: Must reuse the existing security baseline and the HU04/subjects ownership-derivation pattern (single owner-scoped query, no fetch-then-compare); must not accept a client-supplied owner/user identifier for read, update, or delete; must not let a client distinguish "not yours" from "does not exist"; RLS must cover `SELECT`, `UPDATE`, and `DELETE` for `study_tasks`; no new backend framework or service.

**Scale/Scope**: Four new endpoints (list, detail-by-id, update, delete), one extended repository module (also retrofitted to the request-scoped client), one extended schema module, one migration adding two RLS policies, one listing view with inline edit/delete hosted on the existing `/tasks` page.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Specification-First Development — rooted in `specs/006-manage-study-tasks/spec.md` (HU06).
- Pass: Nuxt-Native and Type-Safe Architecture — Nuxt/Nitro/Vue/TypeScript only; no new dependency.
- Pass: Security by Default — ownership derived server-side only via a single owner-scoped query per operation; RLS extended to cover `UPDATE`/`DELETE` and now actually enforced (request-scoped client, not service-role); unauthenticated requests rejected before any protected data is read or changed.
- Pass: Validation and Automated Quality — update payloads validated with a Zod `UpdateStudyTaskSchema` reusing HU05's length/date rules plus a status enum; task id path params validated; automated Vitest coverage required for all four user stories before merge.
- Pass: Simplicity, Traceability and Deployability — single Nuxt project, no new services, no new tables; filtering/sorting explicitly deferred to HU07; traceable to the HU06 GitHub Issue and this spec/plan.

No constitution violations require exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/006-manage-study-tasks/
├── plan.md                                    # This file
├── research.md                                # Phase 0 output
├── data-model.md                              # Phase 1 output
├── quickstart.md                              # Phase 1 output
├── contracts/
│   └── study-task-crud-contract.md            # Phase 1 output
└── tasks.md                                   # Phase 2 output
```

### Source Code (repository root)

```text
app/
├── components/
│   └── tasks/
│       ├── TaskForm.vue            # Existing (HU05), unchanged
│       ├── TaskList.vue            # New: fetches and renders the student's own tasks, status toggle, delete
│       └── TaskEditForm.vue        # New: inline edit for one task (title/description/dueDate)
└── pages/
    └── tasks/
        └── index.vue               # Extended: hosts TaskForm + TaskList

server/
├── api/
│   └── tasks/
│       ├── index.post.ts           # Existing (HU05); retrofitted to the request-scoped client
│       ├── index.get.ts            # New: GET /api/tasks — list own tasks
│       ├── [id].get.ts             # New: GET /api/tasks/:id — detail view of one owned task
│       ├── [id].patch.ts           # New: PATCH /api/tasks/:id — update title/description/dueDate/status
│       └── [id].delete.ts          # New: DELETE /api/tasks/:id — delete (no dependency rule)
└── utils/
    └── tasks/
        ├── schemas.ts               # Extended: UpdateStudyTaskSchema, TaskIdParamSchema
        └── repository.ts            # Extended + retrofitted: request-scoped client throughout

supabase/
└── migrations/
    └── 20260820000000_study_tasks_update_delete_policies.sql   # New: UPDATE/DELETE RLS policies

tests/
└── tasks/
    ├── schema.spec.ts               # Existing (HU05); extended with UpdateStudyTaskSchema cases
    ├── create-task.spec.ts          # Existing (HU05); mocks updated for the retrofitted client param
    ├── ownership.spec.ts            # Existing (HU05); extended with cross-owner detail/update/delete cases
    ├── list-tasks.spec.ts           # New: only-own-tasks listing
    ├── get-task.spec.ts             # New: detail view of an owned task; denial for non-owned/nonexistent
    ├── update-task.spec.ts          # New: valid partial updates (incl. status) + validation rejection
    └── delete-task.spec.ts          # New: successful delete + repeat-delete/nonexistent denial
```

**Structure Decision**: Extend the existing single Nuxt project in place, following the exact grouping convention already established (`app/**/tasks/`, `server/**/tasks/`, `tests/tasks/`). `TaskIdParamSchema` is defined once and shared by `[id].get.ts`, `[id].patch.ts`, and `[id].delete.ts`, mirroring `SubjectIdParamSchema`'s role for subjects.

## Complexity Tracking

No constitution violations or exception justifications identified.
