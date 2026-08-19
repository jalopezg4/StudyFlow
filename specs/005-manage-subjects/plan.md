# Implementation Plan: Manage Existing Subjects

**Branch**: `005-manage-subjects` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-manage-subjects/spec.md`

## Summary

Implement HU04 (list, view, edit, and delete a student's own subjects) as a direct extension of the HU03 `subjects` vertical slice: four new Nitro routes (`GET /api/subjects`, `GET /api/subjects/:id`, `PATCH /api/subjects/:id`, `DELETE /api/subjects/:id`) built on the existing security baseline (`requireAuthenticatedPrincipal`, `validateWithSchema`, `sendSafeError`), new Supabase RLS `UPDATE`/`DELETE` policies mirroring the existing `SELECT`/`INSERT` policies, and a listing page that replaces the session-only "created this session" list with a real fetched listing plus inline edit and delete-with-confirmation UI. Ownership and non-existence are treated identically at the response boundary (a single owner-scoped query, not "fetch then compare"), and the deletion dependency rule (business rule 3) is enforced via a future Postgres foreign key from `study_tasks` rather than an application-level check against a table that does not exist yet in this codebase.

The `GET /api/subjects/:id` detail-view endpoint was added in this revision to close a gap surfaced by `/speckit-analyze`: US3's third acceptance scenario ("Student B attempts to view [Student A's subject] directly... by guessing or supplying its identifier") and FR-002's "detail view" / FR-006's "view" wording both presuppose a single-subject-by-id read path that the original plan never defined. This endpoint fulfills that existing spec text rather than introducing new scope.

## Technical Context

**Language/Version**: TypeScript 5.9.x on Nuxt 4 / Node.js 22+ (unchanged from HU03/TECH-01/TECH-03 baseline)

**Primary Dependencies**: Nuxt 4, Nitro server routes, Vue 3, Zod, `@supabase/supabase-js` (already added in HU03), existing `server/utils/security/*` baseline. No new runtime dependencies.

**Storage**: Supabase PostgreSQL. Extends the existing `subjects` table (no schema/column changes) with new `UPDATE`/`DELETE` RLS policies (see [data-model.md](data-model.md)). Does not create a `study_tasks` table — that remains a future feature's responsibility, with a documented FK contract it must satisfy.

**Testing**: Vitest, following the same route/repository-level pattern established in `tests/subjects/` (HU03) and `tests/security/` (`createTestEvent` fixture): listing (CA01), single-subject detail retrieval and its cross-owner/nonexistent denial (CA03 AC3), update (CA02), cross-owner denial and non-existence for update/delete (CA03 AC1/AC2), and delete including the blocked-by-dependency case (CA04). Playwright E2E remains deferred (see Dependency Risk below).

**Target Platform**: Nuxt full-stack web app deployed via Vercel; Supabase-hosted PostgreSQL. Unchanged.

**Project Type**: Web application — single Nuxt project, no new services. Unchanged.

**Performance Goals**: Not performance-sensitive; listing is a single indexed-by-owner query, update/delete are single-row operations. No explicit SLA requested by the spec.

**Constraints**: Must reuse the existing security baseline and the HU03 ownership-derivation pattern rather than introduce a new authorization mechanism; must not accept a client-supplied owner/user identifier for read, update, or delete; must not let a client distinguish "not yours" from "does not exist" for any id-based operation (detail view, update, or delete); RLS must cover `SELECT`, `UPDATE`, and `DELETE`; no new backend framework or service; no speculative `study_tasks` table.

**Scale/Scope**: Four new endpoints (list, detail-by-id, update, delete), one extended repository module, one extended schema module, one migration adding two RLS policies, one listing page with inline edit/delete. Same student population as the rest of the app.

## Dependency Risk: HU01 Authentication (carried over from HU03)

As of this plan, no code in the repository populates `event.context.auth.userId` from a real session — HU01 (authentication) still has not shipped. This HU inherits the same fail-closed posture documented in `specs/004-subject-management/plan.md`: every route built here goes through `requireAuthenticatedPrincipal`, so until HU01 ships, all requests are correctly and safely rejected as unauthenticated (401), which is fail-closed behavior, not a regression. Automated tests use the same `createTestEvent`-style authenticated-event fixture already established in `tests/security/` and `tests/subjects/`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Specification-First Development — rooted in `specs/005-manage-subjects/spec.md` (HU04).
- Pass: Nuxt-Native and Type-Safe Architecture — Nuxt/Nitro/Vue/TypeScript only; no new dependency.
- Pass: Security by Default — ownership derived server-side only, enforced via a single owner-scoped query per operation, including the detail-view read (no fetch-then-compare step that could leak existence); RLS extended to cover `UPDATE`/`DELETE` (the existing `SELECT` policy already covers the new detail-view read); unauthenticated requests rejected before any protected data is read or changed.
- Pass: Validation and Automated Quality — update payloads validated with a Zod `UpdateSubjectSchema` reusing HU03's length rules; subject id path params validated as well; automated Vitest coverage required for CA01–CA04 before merge.
- Pass: Simplicity, Traceability and Deployability — single Nuxt project, no new services, no new tables; the deletion dependency rule is deferred to a future FK constraint instead of building speculative schema now; traceable to the HU04 GitHub Issue and this spec/plan.

No constitution violations require exceptions.

**Post-Phase 1 re-check**: Design artifacts (`research.md`, `data-model.md`, `contracts/subject-management-crud-contract.md`, `quickstart.md`) introduce no new dependencies, no new services, and no speculative schema (the `study_tasks` dependency is a documented forward contract, not a table created here). All five gates above still pass unchanged after design.

**Second post-Phase 1 re-check (detail-view endpoint added)**: Adding `GET /api/subjects/:id` reuses the existing `subjects_select_own` RLS policy and the existing security baseline; it introduces no new dependency, no new table, and follows the same single-owner-scoped-query pattern as `PATCH`/`DELETE` (Decision 2 in research.md, extended to reads). All five gates still pass.

## Project Structure

### Documentation (this feature)

```text
specs/005-manage-subjects/
├── plan.md                                     # This file
├── research.md                                 # Phase 0 output
├── data-model.md                               # Phase 1 output
├── quickstart.md                               # Phase 1 output
├── contracts/
│   └── subject-management-crud-contract.md     # Phase 1 output
└── tasks.md                                     # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
app/
├── components/
│   └── subjects/
│       ├── SubjectForm.vue         # Existing (HU03), unchanged
│       ├── SubjectList.vue         # New: fetches and renders the student's own subjects
│       └── SubjectEditForm.vue     # New: inline edit for one subject (name/description)
└── pages/
    └── subjects/
        └── index.vue               # Extended: hosts creation form + SubjectList (replaces session-only list)

server/
├── api/
│   └── subjects/
│       ├── index.post.ts           # Existing (HU03), unchanged
│       ├── index.get.ts            # New: GET /api/subjects — list own subjects
│       ├── [id].get.ts             # New: GET /api/subjects/:id — detail view of one owned subject
│       ├── [id].patch.ts           # New: PATCH /api/subjects/:id — update name/description
│       └── [id].delete.ts          # New: DELETE /api/subjects/:id — delete when no dependents
└── utils/
    ├── security/
    │   ├── types.ts                # Extended: add NOT_FOUND (404), CONFLICT (409) error codes
    │   └── errors.ts                # Extended: recognize NOT_FOUND/CONFLICT as known safe codes
    └── subjects/
        ├── schemas.ts               # Extended: UpdateSubjectSchema, SubjectIdParamSchema (shared by GET/:id, PATCH, DELETE)
        └── repository.ts            # Extended: listSubjectsForOwner, getSubjectForOwner, updateSubject, deleteSubject

supabase/
└── migrations/
    └── 20260818010000_subjects_update_delete_policies.sql   # New: UPDATE/DELETE RLS policies

tests/
└── subjects/
    ├── schema.spec.ts               # Existing (HU03); extended with UpdateSubjectSchema cases
    ├── create-subject.spec.ts       # Existing (HU03), unchanged
    ├── ownership.spec.ts            # Existing (HU03); extended with cross-owner detail/update/delete cases (CA03)
    ├── list-subjects.spec.ts        # New: CA01 — only-own-subjects listing
    ├── get-subject.spec.ts          # New: CA03 AC3 — detail view of an owned subject; denial for non-owned/nonexistent
    ├── update-subject.spec.ts       # New: CA02 — valid partial updates + validation rejection
    └── delete-subject.spec.ts       # New: CA04 — successful delete + dependency-blocked delete
```

**Structure Decision**: Extend the existing single Nuxt project in place, following the exact grouping convention HU03 established (`app/**/subjects/`, `server/**/subjects/`, `tests/subjects/`). The only change outside the `subjects` grouping is a small, additive extension to the shared `server/utils/security/*` baseline (two new generic, reusable error codes), since "not found" and "conflict" are legitimate cross-feature security-response categories, not subject-specific concepts. `SubjectIdParamSchema` is defined once and shared by `[id].get.ts`, `[id].patch.ts`, and `[id].delete.ts`, so the id-path-param validation gap flagged by `/speckit-analyze` (finding G1) is resolved by construction rather than duplicated per route.

## Complexity Tracking

No constitution violations or exception justifications identified.
