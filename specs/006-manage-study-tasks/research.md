# Research: Manage Study Tasks

## Decision 1: Single owner-scoped query instead of fetch-then-compare, to avoid existence disclosure

- Decision: `getStudyTaskForOwner`/`updateStudyTask`/`deleteStudyTask` issue one query each with both `id` and `user_id` in the `WHERE`/`.eq()` clause. If the read returns no row, or the update/delete affects zero rows, the route returns a single generic `404 NOT_FOUND` regardless of whether the id belongs to another student or doesn't exist at all.
- Rationale: Identical to HU04's Decision 2 for subjects (`specs/005-manage-subjects/research.md`) — FR-007/FR-008 require denying access to another student's task without revealing whether it exists.
- Alternatives considered: Fetch-then-compare-owner — rejected for the same existence-disclosure reason HU04 already rejected it for subjects.

## Decision 2: Reuse the shared `NOT_FOUND`/`CONFLICT`-capable error envelope; no new error codes needed

- Decision: `NOT_FOUND` (404) already exists in `server/utils/security/types.ts`'s `SecurityErrorCode` union (added by HU04) and is already recognized by `toSafeErrorResponse`. This feature reuses it as-is; `CONFLICT` is not needed here since no deletion dependency rule applies (see spec Clarifications).
- Rationale: Both are generic, reusable security-response categories, not subject- or task-specific; HU04 already did the work of adding them to the shared envelope.
- Alternatives considered: None — this is purely reuse of existing shared infrastructure.

## Decision 3: Retrofit `server/utils/tasks/repository.ts` to the request-scoped Supabase client while extending it

- Decision: `createStudyTask` (existing, HU05) is updated to accept a `SupabaseClient` parameter and use it instead of building its own service-role client, at the same time the four new functions (`listStudyTasksForOwner`, `getStudyTaskForOwner`, `updateStudyTask`, `deleteStudyTask`) are added using that same pattern from the start.
- Rationale: A follow-up PR merged after HU05 (`tech-user-scoped-supabase-client`) already established this pattern for `server/utils/subjects/repository.ts`, so RLS is actually enforced as a defense-in-depth backstop instead of being silently bypassed by a service-role client (see `docs/security/rls-strategy.md`). HU06 touches this exact file to add four functions; leaving `createStudyTask` on the old pattern while its new siblings use the new one would produce an internally inconsistent module for no reason — the retrofit is a small, mechanical, low-risk change (dependency injection, no query logic changes) bundled naturally with work already touching this file.
- Alternatives considered: Leave `createStudyTask` as-is and only build the four new functions on the new pattern — rejected, would leave the module in a confusing half-migrated state and require a *third* PR later just to finish what HU06 could finish now at near-zero extra cost.

## Decision 4: RLS gains `UPDATE`/`DELETE` policies mirroring the existing `SELECT`/`INSERT` ones

- Decision: Add `study_tasks_update_own` (`USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`) and `study_tasks_delete_own` (`USING (auth.uid() = user_id)`) policies via a new migration, leaving the existing table/columns untouched.
- Rationale: Same as HU04 Decision 6 for subjects — explicit, auditable per-operation policies rather than an implicit deny arising from an absent policy, and (unlike HU04's original context) this time actually enforced end-to-end since the repository now uses the request-scoped client (Decision 3).
- Alternatives considered: None — this is the established, proven pattern from the sibling feature.

## Decision 5: Partial update requires at least one of title/description/dueDate/status

- Decision: `UpdateStudyTaskSchema` makes all four fields independently optional (reusing HU05's title/description/dueDate rules, adding a `status` enum), but a Zod-level refinement rejects a payload where none of the four is present.
- Rationale: Same reasoning as HU04's Decision 5 for `UpdateSubjectSchema` — an empty update body is a client bug, not a meaningful no-op.
- Alternatives considered: Silently accept an empty update as a no-op 200 — rejected, same reasoning as HU04.

## Decision 6: No deletion dependency rule

- Decision: `deleteStudyTask` performs an unconditional owner-scoped delete; no foreign-key-violation translation is needed (unlike `deleteSubject`'s `23503` → `409 CONFLICT` handling), because no table currently references `study_tasks`.
- Rationale: The spec's Clarifications state this explicitly. If HU09 (study sessions) later introduces a reference to a study task, that feature is responsible for defining its own dependency rule and any resulting `409 CONFLICT` handling here, the same way HU05 introduced the FK contract that HU04's `deleteSubject` already anticipated.
- Alternatives considered: Pre-emptively adding dependency-check plumbing for a table that doesn't exist yet — rejected as speculative complexity, the same reasoning HU04 used to defer building a placeholder `study_tasks` table.

## Decision 7: Playwright E2E remains deferred

- Decision: No new Playwright spec for this HU. Vitest covers all four user stories at the route/repository level using the existing `createTestEvent` fixture pattern.
- Rationale: Consistent with every prior HU in this codebase (HU03/HU04/HU05); additionally, the CI E2E job is currently failing for an unrelated, pre-existing infrastructure reason (missing Supabase credentials in GitHub Actions, tracked separately), so adding new E2E specs would not currently produce a passing, meaningful signal.
- Alternatives considered: None new beyond what prior HUs already considered and rejected.

## Decision 8: `GET /api/tasks/:id` is included from the start, not added as a later gap-fix

- Decision: Unlike HU04 (which added its detail-view endpoint in a plan revision after `/speckit-analyze` flagged the gap), this plan includes `GET /api/tasks/:id` from the outset, since User Story 3's first acceptance scenario ("Student B attempts to view it directly by id") requires a concrete single-task read path to deny.
- Rationale: Avoid repeating HU04's gap; the need is foreseeable from the spec's own User Story 3 wording.
- Alternatives considered: None — this is a direct application of the lesson already documented in HU04's research.md Decision 8.
