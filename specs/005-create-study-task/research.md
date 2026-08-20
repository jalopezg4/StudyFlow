# Research: Create Study Task

## Decision 1: Verify subject ownership at the application layer before insert, backed by RLS

- Decision: `POST /api/tasks` calls `getSubjectForOwner(principal.userId, body.subjectId)` (the existing subjects repository function from HU03/HU04) before inserting. If it returns `null`, the handler throws `404 NOT_FOUND` without attempting the insert. The `study_tasks` table's `INSERT` RLS policy independently re-checks the same ownership condition as a defense-in-depth backstop.
- Rationale: A clean, predictable `404 NOT_FOUND` at the application layer gives a better error contract than parsing a raw Postgres RLS-denial or foreign-key error. The RLS policy still guarantees the invariant holds even if a future code path forgets the application-layer check, consistent with the layered approach already used for subject creation (research.md Decision 3 in `specs/004-subject-management/`).
- Alternatives considered: Relying solely on RLS and translating its generic denial into a 404 — rejected, because RLS violations surface as a generic Postgres error that is harder to map safely to a specific, non-leaking client message. Relying solely on the application-layer check without RLS — rejected, violates the constitution's "Security by Default" principle (RLS is mandatory for user-owned data).

## Decision 2: Reuse the subjects repository directly instead of duplicating an ownership check

- Decision: `server/utils/tasks/repository.ts` imports and calls `getSubjectForOwner` from `server/utils/subjects/repository.ts` rather than re-implementing a subject-ownership query.
- Rationale: The subjects module already owns the canonical "does this subject belong to this user" query. Duplicating it in the tasks module would create two sources of truth for the same check and risk drift (e.g., if the subjects table gains a soft-delete flag later, only one copy would be updated).
- Alternatives considered: Add a foreign-key-only check (attempt the insert and translate a `23503` error) — rejected as the primary mechanism because a `23503` on `subject_id` cannot distinguish "the subject does not exist" from "the subject belongs to someone else" as cleanly as an explicit pre-check, and would leak which case occurred through timing/error shape in some database configurations.

## Decision 3: `status` is a plain constrained text column, not a Postgres enum type

- Decision: `study_tasks.status` is `text not null default 'pending'` with a `CHECK (status in ('pending', 'completed'))` constraint, mirroring the `text` + `CHECK` pattern already used for `subjects.name`/`description` length limits rather than introducing a Postgres `enum` type.
- Rationale: A `CHECK` constraint is simpler to extend later (e.g., adding a third status) without an `ALTER TYPE` migration, and keeps the codebase's existing constraint style consistent across tables.
- Alternatives considered: Postgres native `enum` type — rejected as unnecessary ceremony for two values, and enum value changes are more invasive to migrate than a `CHECK` constraint.

## Decision 4: `due_date` is a nullable `date` column with no business-rule restriction

- Decision: `due_date date` (nullable), validated by Zod only for being a syntactically valid date. No minimum/maximum bound (e.g., "not in the past") is enforced, per the spec's Clarifications and Edge Cases.
- Rationale: The spec explicitly decided a due date may be any valid date, including past dates, since a student may log catch-up work. Adding an unrequested restriction would contradict the approved spec.
- Alternatives considered: Reject past due dates — rejected, spec explicitly assumes this is allowed.

## Decision 5: Scope this HU to creation only; no `GET /api/tasks` listing route is built

- Decision: The only new route is `POST /api/tasks`. "Immediately retrievable" (SC-001, FR-012) is satisfied by returning the full created task in the `201` response and by the row being queryable through the repository layer (verified by tests), the same approach HU03 used for subjects (`specs/004-subject-management/research.md`, Decision 4).
- Rationale: HU06 (Manage Study Tasks) is the dedicated user story for listing/editing/deleting tasks, matching the same layering already established between HU03 (create) and HU04 (view/edit/delete) for subjects. Building a listing endpoint now would be speculative scope not requested by HU05.
- Alternatives considered: Build a minimal `GET /api/tasks` now "since it's easy" — rejected as scope creep, mirroring the same reasoning HU03 already applied to subjects.

## Decision 6: No new runtime dependency

- Decision: Reuse `@supabase/supabase-js` (added in HU03) and the existing `server/utils/security/*` baseline. No new package is added to `package.json`.
- Rationale: The security/validation/persistence primitives this feature needs already exist and are proven by the subjects feature; introducing anything new would contradict the constitution's simplicity principle.
- Alternatives considered: None warranted.
