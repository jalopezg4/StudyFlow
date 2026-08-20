# Implementation Plan: Subject Management

**Branch**: `004-subject-management` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-subject-management/spec.md`

## Summary

Implement HU03 (create a subject) as a single Nuxt/Nitro vertical slice: a `subjects` Supabase table protected by RLS, a Zod-validated `POST /api/subjects` route that derives ownership exclusively from the server-resolved authenticated principal, and a minimal creation form with loading/success/error states. Scope is intentionally limited to creation — listing, editing, and deleting subjects are separate future user stories. "Appears in the listing" (CA01) is satisfied and verified at the persistence/authorization layer (the row exists, is queryable, and is scoped to its owner); no persisted listing page is built in this HU, matching the subtasks in the GitHub issue.

## Technical Context

**Language/Version**: TypeScript 5.9.x on Nuxt 4 / Node.js 22+ (matches TECH-01/TECH-03 baseline)

**Primary Dependencies**: Nuxt 4, Nitro server routes, Vue 3, Zod, existing `server/utils/security/*` baseline (`requireAuthenticatedPrincipal`, `validateWithSchema`, `createSafeHttpError`/`sendSafeError`), Vitest, @nuxt/test-utils. New dependency: `@supabase/supabase-js` (server-only usage) — not yet present in `package.json` and must be added as part of implementation.

**Storage**: Supabase PostgreSQL. New `subjects` table with RLS (see [data-model.md](data-model.md)). No existing product tables to migrate.

**Testing**: Vitest for schema validation, route-handler behavior (CA01–CA03), and authorization/ownership tests, following the existing pattern in `tests/security/` (`createTestEvent` fixture). Playwright E2E is deferred for this HU (see Risks) since there is no real login UI yet to drive a browser session.

**Target Platform**: Nuxt full-stack web app deployed via Vercel; Supabase-hosted PostgreSQL.

**Project Type**: Web application — single Nuxt project (no separate frontend/backend services), consistent with the constitution's "no separate backend framework" rule.

**Performance Goals**: Not performance-sensitive; a single-row insert per request is expected to complete well under typical interactive-UI latency budgets (no explicit SLA requested by the spec).

**Constraints**: Must reuse the existing security baseline rather than re-implement authentication/error handling; must not accept a client-supplied owner/user identifier; RLS must be enabled on the new table; no new backend framework or service.

**Scale/Scope**: One table, one write endpoint, one form. Supports the same student population as the rest of the app; no unusual scale requirements.

## Dependency Risk: HU01 Authentication

`requireAuthenticatedPrincipal` (in `server/utils/security/auth.ts`) reads `event.context.auth.userId`, but no code in the repository currently populates that context field from a real session — `tests/security/fixtures.ts` only fakes it for unit tests, and there is no Supabase Auth client, cookie/session middleware, or login UI yet. This confirms HU01 (authentication) has not shipped in code, even though the TECH-03 baseline already defines the contract it must satisfy.

**Decision**: HU03 does **not** re-implement authentication. It is built strictly against the existing `event.context.auth.userId` contract. Until HU01 ships a mechanism that populates that context (e.g., a Nitro plugin resolving a Supabase session), every request to `POST /api/subjects` will correctly and safely be rejected as unauthenticated (CA03 behavior) — this is fail-closed, not a regression, and lets HU03 be implemented, tested, and merged independently of HU01's delivery timing, per the constitution's traceability/independence expectations. Automated tests for the authenticated paths (CA01, CA02) use the same `createTestEvent`-style fixture pattern already established in `tests/security/`, not a live login.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Specification-First Development — rooted in `specs/004-subject-management/spec.md` (HU03).
- Pass: Nuxt-Native and Type-Safe Architecture — Nuxt/Nitro/Vue/TypeScript only; the one new dependency (`@supabase/supabase-js`) is the constitution's own mandated database client, not an additional framework.
- Pass: Security by Default — ownership derived server-side only from `requireAuthenticatedPrincipal`; RLS enforced on `subjects`; unauthenticated requests rejected before persistence (see Dependency Risk above).
- Pass: Validation and Automated Quality — all untrusted input validated with a Zod `CreateSubjectSchema`; automated Vitest coverage required for CA01–CA03 before merge.
- Pass: Simplicity, Traceability and Deployability — single Nuxt project, no new services; scope limited to creation to avoid speculative listing/edit/delete work; traceable to the HU03 GitHub Issue and this spec/plan.

No constitution violations require exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/004-subject-management/
├── plan.md                                # This file
├── research.md                            # Phase 0 output
├── data-model.md                          # Phase 1 output
├── quickstart.md                          # Phase 1 output
├── contracts/
│   └── subject-management-contract.md     # Phase 1 output
└── tasks.md                               # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
app/
├── components/
│   └── subjects/
│       └── SubjectForm.vue        # Name + description fields, loading/success/error states
└── pages/
    └── subjects/
        └── index.vue              # Hosts SubjectForm; renders success confirmation

server/
├── api/
│   └── subjects/
│       └── index.post.ts          # POST /api/subjects — auth -> validate -> insert
└── utils/
    └── subjects/
        ├── schemas.ts             # CreateSubjectSchema (Zod)
        └── repository.ts          # Supabase insert for subjects, owner-scoped

supabase/
└── migrations/
    └── 20260818000000_create_subjects_table.sql   # Table + RLS policies

tests/
└── subjects/
    ├── schema.spec.ts             # CreateSubjectSchema unit tests (CA02 rules)
    ├── create-subject.spec.ts     # Route-level behavior for CA01/CA02 (mocked repository)
    └── ownership.spec.ts          # CA03 + cross-user isolation (mocked/unauthenticated event)
```

**Structure Decision**: Extend the existing single Nuxt project in place — no new package or service boundary. New subject-specific code is grouped under `app/**/subjects/`, `server/**/subjects/`, and `tests/subjects/`, mirroring the existing `server/**/security/` grouping convention. `app/pages/subjects/index.vue` hosts only the creation form for this HU; a persisted listing view is explicitly deferred to a future user story.

## Complexity Tracking

No constitution violations or exception justifications identified.
