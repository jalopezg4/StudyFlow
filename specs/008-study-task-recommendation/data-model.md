# Data Model: Study Task Recommendation

No schema changes. This feature adds no tables, columns, or migrations — it adds one new read-only query over the existing `study_tasks` table (see `specs/005-create-study-task/data-model.md` and `specs/006-manage-study-tasks/data-model.md` for the table itself).

## Study Task (unchanged)

Same shape returned by every other task endpoint (`server/utils/tasks/repository.ts`'s `StudyTask`):

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key; final tiebreak in the recommendation ordering. |
| `subjectId` | `uuid` | FK to `subjects.id`. Not part of the recommendation criteria. |
| `subjectName` | `string` | Denormalized read-only embed via `subjects(name)`. |
| `title` | `string` | Not part of the recommendation criteria. |
| `description` | `string \| null` | Not part of the recommendation criteria. |
| `dueDate` | `string (YYYY-MM-DD) \| null` | **Primary recommendation criterion** — ascending, so the soonest (or most overdue) date wins; `NULL` sorts last (PostgreSQL default). |
| `status` | `'pending' \| 'completed'` | **Eligibility filter** — only `'pending'` tasks participate; `'completed'` is excluded before ordering. |
| `createdAt` | `string (ISO 8601)` | **First tiebreak** — ascending (oldest task first) when two or more eligible tasks share the same `dueDate` value (including two or more with no due date at all). |

## Recommendation (derived, not persisted)

Not a new entity or table — a single selection over the Study Task listing, computed fresh on every request.

| Concept | Definition |
|---|---|
| Eligible task set | All of the requesting student's own `study_tasks` rows where `status = 'pending'`. |
| Ranking | Ascending `due_date` (NULLs last) → ascending `created_at` → ascending `id`. |
| Result | The single highest-ranked eligible task, or `null` if the eligible set is empty (FR-004). |

### Ranking example

Given a student's pending tasks:

| Task | `dueDate` | `createdAt` |
|---|---|---|
| A | `2026-09-05` | `2026-08-01` |
| B | `2026-09-01` | `2026-08-03` |
| C | `null` | `2026-08-02` |
| D | `null` | `2026-08-01` |

Ranking order: **B** (soonest due date) → **A** (later due date, but still has one) → **D** (no due date, but older than C) → **C**. The recommendation returns **B**.

### Determinism (FR-003, SC-002)

The three-key ordering (`dueDate`, `createdAt`, `id`) is a total order over any set of rows a student can own: `id` is a unique, non-null primary key, so no two distinct tasks can tie on all three keys simultaneously. Repeating the same request against unchanged data therefore always yields the same recommendation.
