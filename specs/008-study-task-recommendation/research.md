# Research: Study Task Recommendation

## Decision 1: One new route, `GET /api/tasks/recommendation`, not a query parameter on the existing listing

- Decision: Add a dedicated `server/api/tasks/recommendation.get.ts` route rather than, e.g., a `?recommend=true` flag on `GET /api/tasks`.
- Rationale: HU07 extended the existing listing route because filtering/sorting is still fundamentally "give me a list." US08 returns a single task or none — a structurally different response shape (`{ task: StudyTask | null }` vs `{ tasks: StudyTask[] }`). Overloading one route with two incompatible response shapes selected by a flag would be more confusing than a second, clearly-named route, and FR-008's "reuse the existing model, don't duplicate it" is about the Study Task entity/schema/repository, not about routes — a new route serving a genuinely new capability is not duplication.
- Alternatives considered: A query parameter on `GET /api/tasks` — rejected for the response-shape mismatch above. A `POST` action-style endpoint — rejected; this is a pure read with no side effects, so `GET` is the correct verb and matches every other read in this codebase.

## Decision 2: A dedicated repository query, not a call into `listStudyTasksForOwner`

- Decision: `getRecommendedTaskForOwner(supabase, userId)` issues its own query: `.eq('user_id', userId).eq('status', 'pending').order('due_date', { ascending: true }).order('created_at', { ascending: true }).order('id', { ascending: true }).limit(1).maybeSingle()`, rather than calling HU07's `listStudyTasksForOwner` with `sort: { by: 'dueDate' }` and taking the first result.
- Rationale: The spec's Clarifications session settled the tiebreak order as due date ascending (undated last, via PostgreSQL's own `NULLS LAST` default on ascending sort — no special-casing needed), then oldest `created_at`, then `id`. HU07's generic listing sort always appends `id` as the *immediate* secondary tiebreak after whichever single criterion was requested (research.md Decision 6 in `specs/007-filter-sort-study-tasks/`) — it has no `created_at` step in between when sorting by due date. Reusing it as-is would silently produce a different tie order than the one just clarified with the user. A three-key `.order()` chain plus `.eq('status', 'pending')` plus `.limit(1).maybeSingle()` is a small, direct, independently-correct query — not a parallel task *model* (the FR-008 concern), just a different query shape against the same table, same columns, same `toStudyTask` mapping.
- Alternatives considered: Extend `listStudyTasksForOwner`'s sort options with a new `'recommendation'` pseudo-criterion that produces this exact three-key order — rejected as over-general; that function's contract (research.md Decision 5 in HU07) is "one allow-listed client-facing sort criterion plus the `id` tiebreak," and bending it to fit one internal, never-client-selectable use case would make it harder to reason about for its actual purpose (US07's `sortBy`/`sortDir` query parameters).

## Decision 3: `status = 'pending'` filter at the query level, not "fetch all and filter completed client-side"

- Decision: The repository query includes `.eq('status', 'pending')` directly, rather than fetching every owned task and filtering out `completed` ones in application code.
- Rationale: Identical reasoning to every ownership/filter decision in this codebase (HU05 Decision 1, HU07 Decision 4): push the exclusion into the query itself so there is no code path where a completed task is ever loaded into memory and then has to be correctly discarded — the guarantee is structural, not procedural. It is also strictly less code and one fewer thing to get wrong under FR-002/AC02.
- Alternatives considered: Fetch via `listStudyTasksForOwner` (no filter) and pick the first `status === 'pending'` row in JS — rejected; requires re-implementing the sort/tiebreak in JS anyway once due dates/ties are involved (Decision 2), so there is no simplicity gained, only a weaker guarantee.

## Decision 4: Empty-state is `200 OK` with `task: null`, not `404`

- Decision: When no eligible task exists, `handleGetRecommendation` still returns `200 OK` with `{ status: 'ok', task: null }` — never a `404` or any error status.
- Rationale: FR-004/AC03/User Story 2 all frame "no eligible tasks" as a normal, valid, expected state (a caught-up student), explicitly not an error. `404 NOT_FOUND` in this codebase's existing convention (`server/utils/tasks/schemas.ts`'s `parseTaskId`, `getStudyTaskForOwner`) means "the specific resource you asked for by id doesn't exist or isn't yours" — a different semantic (a failed lookup of a *specific* thing) from "here is the answer to 'what should I study,' and the answer is nothing." Reusing `404` here would conflate the two and require every client to special-case a "successful" 404, which is exactly the kind of ambiguity FR-004 explicitly rules out.
- Alternatives considered: `204 No Content` — rejected; this codebase has no existing precedent for `204` anywhere, and an empty JSON body (`{ status: 'ok', task: null }`) is simpler for the client to handle uniformly (always parse JSON, always check `task`) than branching on status code vs. body.

## Decision 5: No Zod schema for this route

- Decision: `recommendation.get.ts` performs no `validateWithSchema` call at all — there is no request body and no query parameters to validate.
- Rationale: The constitution's Validation and Automated Quality principle requires validating *untrusted input*; a route with no input has nothing to validate. Adding a schema module for an empty input shape would be pure ceremony with no security or quality benefit, inconsistent with the Simplicity principle.
- Alternatives considered: None — this is a direct absence-of-need conclusion, not a tradeoff between real alternatives.

## Decision 6: No UI added in this iteration

- Decision: This plan ships the `GET /api/tasks/recommendation` contract only. No new component, no change to `app/pages/tasks/index.vue` or the dashboard.
- Rationale: Identical reasoning to HU07's research.md Decision 8 — the spec (and the source GitHub issue) is written entirely in request/response terms with no UI-observable acceptance criterion. HU07 shipped backend-only for the same reason and a small filter/sort UI was added quickly afterward, on request, without disturbing the already-shipped contract — the same low-risk path is available here if a "what should I study" widget is wanted later.
- Alternatives considered: Add a "Recommended next" card to the dashboard or `/tasks` page in the same PR — deferred as unrequested scope, consistent with the constitution's traceability-to-issue principle; easy to layer on afterward against this exact contract.
