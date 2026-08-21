# Data Model: Filter and Sort Study Tasks

No schema changes. This feature adds no tables, columns, or migrations — it adds read-only query parameters over the existing `study_tasks` table (see `specs/005-create-study-task/data-model.md` and `specs/006-manage-study-tasks/data-model.md` for the table itself).

## Study Task (unchanged)

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key; used as this feature's deterministic sort tiebreaker (Decision 6). |
| `subjectId` | `uuid` | FK to `subjects.id`; filterable (`?subjectId=`). |
| `subjectName` | `string` | Denormalized read-only embed via `subjects(name)`; not filterable/sortable. |
| `title` | `string` | Sortable (`?sortBy=title`). |
| `description` | `string \| null` | Not filterable/sortable in this iteration. |
| `dueDate` | `string (YYYY-MM-DD) \| null` | Sortable (`?sortBy=dueDate`); `NULL` sorts per PostgreSQL's default and is not overridden (`NULLS LAST` ascending, `NULLS FIRST` descending) — see the contract's "NULL due-date ordering" section. |
| `status` | `'pending' \| 'completed'` | Filterable (`?status=`). |
| `createdAt` | `string (ISO 8601)` | Sortable (`?sortBy=createdAt`); this is HU06's existing default sort column. |

## New: Task List Query (request-side, not persisted)

Validated by `TaskListQuerySchema` (`server/utils/tasks/schemas.ts`). Every field is optional; supplying none reproduces HU06's existing default listing exactly (Decision 7).

| Field | Allow-listed values | Default when omitted | Validation |
|---|---|---|---|
| `status` | `pending`, `completed` | not applied (no status filter) | Exact case-sensitive match; anything else (including case variants like `Pending`) is a validation error. Repeated `status` params (array) are a validation error. |
| `subjectId` | any well-formed UUID | not applied (no subject filter) | Must be a valid UUID string. Ownership of the subject is *not* separately checked — see research.md Decision 4; a syntactically valid but unowned subject id is accepted by validation and naturally yields an empty result at query time. |
| `sortBy` | `dueDate`, `createdAt`, `title` | `createdAt` (HU06's existing default column) | Exact match against the allow-list; anything else is a validation error. |
| `sortDir` | `asc`, `desc` | Per-`sortBy` default (see below); `desc` when `sortBy` is also omitted | `sortDir` supplied without `sortBy` is a validation error (a direction alone cannot be applied to anything). Anything other than `asc`/`desc` is a validation error. |

### Per-criterion default direction (used only when `sortBy` is supplied without `sortDir`)

| `sortBy` | Default `sortDir` | Rationale |
|---|---|---|
| `dueDate` | `asc` | Soonest-due first — directly serves "identify tasks that require my attention." |
| `createdAt` | `desc` | Matches HU06's pre-existing default order (most recently created first). |
| `title` | `asc` | Alphabetical. |

### Deterministic ordering (FR-012)

Every query — filtered, sorted, both, or neither — appends a secondary `ORDER BY id ASC` after the primary criterion (or after HU06's `created_at DESC` default when no `sortBy` is supplied). `id` is a non-null unique UUID, so this fully resolves any tie on the primary criterion, including `dueDate IS NULL` ties.

### Combination semantics (FR-005, FR-006)

- Multiple filters (`status` + `subjectId`) combine with AND: a task must match every supplied filter.
- A filter and a sort criterion may be supplied together; the filter narrows the row set, the sort criterion (plus the `id` tiebreaker) orders it.
- If **any** supplied parameter — filter or sort — fails validation, the entire request is rejected; no partial filtering/sorting is applied and no task data is returned (FR-008, US4 Acceptance Scenario 2).
