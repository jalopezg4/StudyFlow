# Phase 0 Research: Study Session Recording

## Decision 1: Reuse the existing request-scoped Supabase security path

- **Decision**: Session creation will resolve the authenticated principal with the existing server security helpers and persist through the request-scoped Supabase client.
- **Rationale**: The client is bound to the caller's session and allows Supabase RLS to remain an active defense in depth. A service-role client would bypass RLS and weaken the ownership guarantee.
- **Alternatives considered**: Trusting a client-supplied `userId` was rejected because ownership must come from the authenticated request. A service-role repository was rejected because it bypasses RLS.

## Decision 2: Model a required subject and optional task

- **Decision**: A study session stores a required `subject_id` and nullable `task_id`. When `task_id` is supplied, the server verifies that the task belongs to the authenticated user and has the supplied subject.
- **Rationale**: This supports free-form study under a subject while allowing more precise task tracking. Existing tasks already belong to subjects, so the cross-resource consistency check is explicit and testable.
- **Alternatives considered**: Requiring a task would prevent recording study that is not tied to a specific task. Allowing both references to be independently optional would permit orphaned sessions.

## Decision 3: Store whole duration minutes with a bounded domain

- **Decision**: Store `duration_minutes` as a positive integer from 1 through 1,440.
- **Rationale**: Whole minutes match the initial user-facing workflow and are sufficient for progress reporting. The upper bound prevents accidental or abusive values while allowing a full day of study as an explicit maximum.
- **Alternatives considered**: Seconds add precision that the current story does not need. Decimal minutes introduce rounding ambiguity and a less predictable contract.

## Decision 4: Validate referenced ownership before insertion

- **Decision**: The creation path will verify the subject belongs to the authenticated user, then verify an optional task belongs to the same user and subject before inserting the session.
- **Rationale**: Existing repository functions already encode owner-scoped lookups. Performing the checks before mutation makes the acceptance criteria observable and prevents inconsistent subject/task pairs.
- **Alternatives considered**: Relying only on client-loaded dropdowns was rejected because clients are untrusted. Relying only on a database trigger would make the rule less visible in the application contract and harder to test at the route boundary.

## Decision 5: Use a dedicated creation endpoint and no client owner fields

- **Decision**: Expose `POST /api/study-sessions` with a body containing `subjectId`, optional `taskId`, and `durationMinutes`; owner and timestamps are server-controlled.
- **Rationale**: A dedicated resource endpoint makes the new entity traceable and keeps the existing subject/task contracts unchanged.
- **Alternatives considered**: Adding session fields to task creation was rejected because the operations have different lifecycles and validation rules.
