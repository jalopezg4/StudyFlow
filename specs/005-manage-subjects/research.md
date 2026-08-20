# Research: Manage Existing Subjects

## Decision 1: Reuse the server-only-client + explicit-filter ownership pattern from HU03

- Decision: `GET /api/subjects`, `GET /api/subjects/:id`, `PATCH /api/subjects/:id`, and `DELETE /api/subjects/:id` all use the same server-only Supabase client (service role) as HU03's create path, and always derive the acting owner from `requireAuthenticatedPrincipal(event).userId`. Every query explicitly filters by `user_id = principal.userId` in addition to RLS.
- Rationale: Consistent with HU03 Decision 1 (`specs/004-subject-management/research.md`); avoids introducing a second, per-request-JWT-scoped Supabase client purely for this HU, which would still be premature ahead of HU01's session design.
- Alternatives considered: Switch to a user-JWT-scoped client now so RLS alone enforces ownership — rejected, same reasoning as HU03 (couples this feature to HU01's undefined session/token surface).

## Decision 2: Single owner-scoped query instead of fetch-then-compare, to avoid existence disclosure

- Decision: `getSubjectForOwner`/`updateSubject`/`deleteSubject` issue one query each with both `id` and `user_id` in the `WHERE`/`.eq()` clause (`SELECT ... WHERE id = :id AND user_id = :userId`, `UPDATE ... WHERE id = :id AND user_id = :userId`, `DELETE ... WHERE id = :id AND user_id = :userId`). If the read returns no row, or the update/delete affects zero rows, the route returns a single generic `404 NOT_FOUND` regardless of whether the id belongs to another student or doesn't exist at all.
- Rationale: FR-006/FR-007 of the spec require denying access to another student's subject without revealing whether it exists. The illustrative `assertResourceOwnership` helper in `server/utils/security/authorization.ts` (used by the `server/api/security/baseline-owned-resource.*` template routes) fetches first and compares owner afterward, which would let a caller distinguish "403 forbidden, so it exists" from "404, doesn't exist." That helper is fine for the illustrative baseline routes but is intentionally not reused here.
- Alternatives considered: Fetch the row, then call `assertResourceOwnership` (403 on mismatch) — rejected, leaks existence via the 403/404 split, and is the exact anti-pattern the spec's Edge Cases and FR-007 call out.

## Decision 3: Extend the shared `SecurityErrorCode` union with `NOT_FOUND` and `CONFLICT`

- Decision: Add `NOT_FOUND` (404) and `CONFLICT` (409) to `server/utils/security/types.ts`'s `SecurityErrorCode`, and extend the known-code allowlist in `toSafeErrorResponse` (`server/utils/security/errors.ts`) to pass them through unchanged (today, any code outside `UNAUTHENTICATED | FORBIDDEN | VALIDATION_ERROR | INTERNAL_ERROR` collapses to `VALIDATION_ERROR` for non-5xx statuses, which would mislabel a 404/409 response).
- Rationale: Both are generic, reusable security-response categories (not `subjects`-specific), consistent with how `FORBIDDEN` and `VALIDATION_ERROR` are already shared across features. Reusing the same envelope keeps error handling centralized rather than inventing a parallel per-feature error shape.
- Alternatives considered: A subjects-only error type/module — rejected, duplicates the existing safe-error envelope for no benefit and would need its own `sendSafeError`-equivalent.

## Decision 4: Enforce the deletion dependency rule via a future Postgres FK, not an application-level check today

- Decision: HU04 does not create a `study_tasks` table and does not run a `SELECT count(*) FROM study_tasks WHERE subject_id = ...` pre-check. Instead, `deleteSubject` issues the scoped `DELETE` and inspects the Postgres error: if the delete fails with a foreign-key-violation (`error.code === '23503'`), it is translated into a safe `409 CONFLICT` ("subject has associated study tasks and cannot be deleted"). The eventual study-task migration is expected (and documented in `data-model.md`) to declare `subject_id uuid not null references public.subjects(id) on delete restrict` — the default/`RESTRICT` FK behavior is exactly the "block deletion while tasks exist" rule from business rule 3, enforced by the database with zero additional application code once that table exists.
- Rationale: The spec's own Assumptions section states the dependency check must "take effect automatically once tasks exist, without requiring a follow-up change to this feature." A DB-level FK constraint is the only mechanism that satisfies that literally — an application-level count query would either require creating speculative schema now (contradicting Simplicity) or would require editing this feature's code again once the real `study_tasks` table ships (contradicting the spec's own constraint). Until `study_tasks` exists, there is no FK to violate, so deletion of an owned subject always succeeds today, exactly matching the spec's stated interim behavior.
- Alternatives considered: (a) Create a minimal placeholder `study_tasks` table now just to support a count query — rejected as scope creep not requested by this ticket (a new domain table is a bigger commitment than a documented FK contract). (b) Soft delete (`deleted_at`) as the "controlled deletion" alternative the ticket mentions — rejected: CA04 ("elimina la materia... deja de mostrarla en su listado") describes a real removal, and soft-delete would require every future query in the codebase to remember to filter it out, which is more complexity than the blocking approach for no requested benefit.

## Decision 5: Partial update requires at least one field

- Decision: `UpdateSubjectSchema` makes `name` and `description` both optional individually (reusing HU03's trim/length rules), but a Zod-level refinement rejects a payload where neither field is present.
- Rationale: CA02 says the student "modifica su nombre o descripción" (either or both); an empty update body is a client bug, not a meaningful no-op, and should surface as a validation error rather than silently succeeding.
- Alternatives considered: Silently accept an empty update as a no-op 200 — rejected, hides a likely client-side bug and gives no actionable feedback.

## Decision 6: RLS gains `UPDATE`/`DELETE` policies mirroring the existing `SELECT`/`INSERT` ones

- Decision: Add `subjects_update_own` (`USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`) and `subjects_delete_own` (`USING (auth.uid() = user_id)`) policies via a new migration, leaving the existing table/columns untouched.
- Rationale: The constitution requires Supabase RLS to protect user-owned data, and the app's service-role client bypasses RLS the same way it did in HU03 — RLS here is the same defense-in-depth backstop as HU03 Decision 1, not the primary enforcement path, but its absence would leave `UPDATE`/`DELETE` denied-by-default only by omission rather than by an explicit, auditable policy.
- Alternatives considered: Leave `UPDATE`/`DELETE` with no policy (RLS default-deny) and rely solely on the application-layer scoped query — rejected, since the constitution and TECS-03 RLS strategy expect explicit per-operation policies to exist and be reviewable, not an implicit deny arising from an absent policy.

## Decision 7: Playwright E2E remains deferred

- Decision: Same as HU03 Decision 5 — no new Playwright spec for this HU. Vitest covers CA01–CA04 at the route/repository level using the existing `createTestEvent`-style fixture pattern.
- Rationale: HU01 (real login) still has not shipped (see Dependency Risk in plan.md); a genuine browser E2E test still cannot authenticate a real session without faking it in a way that adds no coverage beyond the existing Vitest approach.
- Alternatives considered: Stub authentication in Playwright via a test-only cookie/header — rejected for the same reason as HU03 (would hard-code assumptions about HU01's eventual session shape).

## Decision 8: Add `GET /api/subjects/:id` to fulfill US3 AC3 / FR-002 / FR-006, resolving a gap surfaced by `/speckit-analyze`

- Decision: Add a fourth endpoint, `GET /api/subjects/:id`, returning the single subject when owned by the requesting principal. It reuses `SubjectIdParamSchema` (the same id-param schema `PATCH`/`DELETE` use) and the same single-owner-scoped-query pattern from Decision 2, extended to reads: `SELECT ... WHERE id = :id AND user_id = :userId`, returning `404 NOT_FOUND` when no row matches (whether the id belongs to another student or doesn't exist at all).
- Rationale: `/speckit-analyze` flagged (finding I1, CRITICAL) that US3's third acceptance scenario — "Student B attempts to view it [Student A's subject] directly... by guessing or supplying its identifier" — and FR-002's "detail view" / FR-006's "view" wording both presuppose a single-subject-by-id read path, but the original plan only defined `GET /api/subjects` (list), `PATCH /:id`, and `DELETE /:id`. Without a detail-view endpoint, that acceptance scenario had no way to be built or tested. Adding this endpoint fulfills existing spec text (FR-002, FR-006, US3 AC3) rather than introducing new scope.
- No new RLS policy is needed: the existing `subjects_select_own` policy (from HU03) already covers a single-row `SELECT` scoped by owner, the same as it covers the list query.
- Alternatives considered: (a) Reword spec.md's US3 AC3/FR-002/FR-006 to drop the "view directly"/"detail view" language and rely on the fact that a non-owned subject simply never appears in the list — rejected here because the user explicitly requested building the endpoint (per the `/speckit-plan` invocation that produced this decision) rather than narrowing the spec; either resolution was valid per the analysis report's Next Actions. (b) Fold detail-view semantics into the existing list endpoint via a query parameter (`GET /api/subjects?id=...`) — rejected, a path-scoped resource id is the more conventional REST shape and reuses `SubjectIdParamSchema` identically to `PATCH`/`DELETE` instead of inventing a query-param variant.
