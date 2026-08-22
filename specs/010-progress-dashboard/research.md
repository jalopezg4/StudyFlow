# Phase 0 Research: Study Progress Dashboard

## Decision 1: Use a read-only progress endpoint

- **Decision**: Expose `GET /api/dashboard/progress` and reuse the existing protected dashboard page.
- **Rationale**: The dashboard needs one stable response containing task and session metrics. A dedicated read-only endpoint keeps aggregation server-side and prevents client-side ownership or calculation drift.
- **Alternatives considered**: Fetching tasks and sessions separately from the browser was rejected because it duplicates orchestration and exposes more raw data than the summary requires.

## Decision 2: Aggregate existing tables without a new metrics table

- **Decision**: Calculate metrics from `study_tasks` and `study_sessions` at request time; do not persist derived dashboard rows.
- **Rationale**: Counts and totals are derived data that can become stale after task/session changes. Request-time calculation keeps the dashboard consistent with the current source of truth.
- **Alternatives considered**: A cached or persisted progress table was rejected as unnecessary complexity for the initial dashboard and would require invalidation on every task/session mutation.

## Decision 3: Scope every source query by the authenticated user

- **Decision**: The repository receives the server-derived `userId` and applies owner filters to both task and session queries using the request-scoped Supabase client.
- **Rationale**: Explicit owner scoping is required by the security baseline, while RLS provides a second enforcement layer.
- **Alternatives considered**: Relying only on client-side filtering was rejected. Relying only on RLS was rejected because application-level ownership remains an explicit project convention.

## Decision 4: Return a stable zero-valued summary for empty data

- **Decision**: An empty response returns zero counts, `completionPercentage: 0`, `totalStudyMinutes: 0`, and `hasActivity: false` with a successful response.
- **Rationale**: A new or inactive student is a valid product state, not an error. A stable shape simplifies the UI and tests.
- **Alternatives considered**: Returning `null` metrics or a 404 was rejected because the dashboard exists for every authenticated student.

## Decision 5: Keep aggregation rules explicit and integer-based

- **Decision**: Count `completed` and `pending` statuses exactly, derive the percentage as rounded `completed / total * 100`, and sum whole `duration_minutes` values.
- **Rationale**: Existing database constraints define the valid status and duration domains. Explicit rules make the output deterministic and auditable.
- **Alternatives considered**: Inferring pending as `total - completed` was rejected as less defensive if future statuses are introduced. Decimal percentages were rejected for a compact dashboard summary.
