# Data Model: Manage Study Tasks

## Overview

HU06 does not change the `study_tasks` table's columns. It extends the row-level security policy set (adding `UPDATE`/`DELETE`) and retrofits the repository module to use the request-scoped Supabase client established after HU05, so those new policies (and the existing `SELECT`/`INSERT` ones) are actually enforced rather than bypassed.

## Entities

### Study Task (unchanged shape, extended access rules)

Introduced in HU05 (`specs/005-create-study-task/data-model.md`); no new columns here.

**Fields** (unchanged from HU05)

| Column        | Type          | Constraints                                                                 |
|---------------|---------------|-------------------------------------------------------------------------------|
| `id`          | `uuid`        | Primary key, default `gen_random_uuid()`                                      |
| `user_id`     | `uuid`        | Not null, references `auth.users(id)` on delete cascade                       |
| `subject_id`  | `uuid`        | Not null, references `subjects(id)`, **`on delete cascade`** *(amended — see below)* |
| `title`       | `text`        | Not null, trimmed length between 1 and 100 characters (DB check)              |
| `description` | `text`        | Nullable, length ≤ 500 characters when present (DB check)                     |
| `due_date`    | `date`        | Nullable, no additional restriction                                           |
| `status`      | `text`        | Not null, default `'pending'`, one of `'pending'` / `'completed'` (DB check)  |
| `created_at`  | `timestamptz` | Not null, default `now()`                                                     |

**New access rules for this HU**

- Listing (`GET /api/tasks`) MUST return only rows where `user_id` equals the authenticated principal's id, across all subjects (FR-001, FR-003).
- Detail view (`GET /api/tasks/:id`) MUST return the task only when `id` and `user_id` both match, using the same single scoped query as update/delete — never a separate fetch-then-compare step (FR-002, FR-007, FR-008).
- Update (`PATCH /api/tasks/:id`) MUST apply only when `id` and `user_id` both match; any of `title`/`description`/`due_date`/`status` may be updated independently (FR-004, FR-005, FR-007, FR-008).
- Delete (`DELETE /api/tasks/:id`) MUST apply under the same scoping rule; no dependency rule blocks it today (FR-011, FR-012).
- A request targeting an `id` that either does not exist or belongs to a different student MUST produce the same generic not-found outcome for detail view, update, and delete alike (FR-008).

## Amendment: Subject Deletion Cascade (FR-013)

Reverses HU04's original blocking rule (`specs/005-manage-subjects/spec.md` FR-010/FR-011, `specs/005-manage-subjects/data-model.md`'s "Dependency Contract"). Two changes:

1. **`study_tasks.subject_id`'s foreign key** now declares `on delete cascade` instead of the default `restrict` HU05 originally used (`supabase/migrations/20260820020000_study_tasks_subject_cascade_delete.sql`). Deleting a subject now deletes its study tasks at the database level — no application code performs the cascade; Postgres does.
2. **`Subject` gains a `taskCount` field** (`server/utils/subjects/repository.ts`), computed via a PostgREST embedded count (`study_tasks(count)`) on `subjects`. `GET /api/subjects` and `GET /api/subjects/:id` both return it, so the client can warn the student ("This subject has N tasks. Deleting it will also delete them.") before they confirm a delete — this is the safety mechanism that makes the cascade acceptable from a data-loss standpoint, per the Clarifications session that authorized this amendment.

`deleteSubject`'s prior `23503` (foreign-key-violation) → `409 CONFLICT` translation is removed as dead code: with `on delete cascade`, that violation can no longer occur.

## Row Level Security

RLS is already enabled on `study_tasks` (from HU05). This HU adds two policies:

- **UPDATE** (`study_tasks_update_own`): `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` — a caller can only update rows they own, and cannot use an update to reassign a row to a different owner.
- **DELETE** (`study_tasks_delete_own`): `USING (auth.uid() = user_id)` — a caller can only delete rows they own.

The existing `SELECT`/`INSERT` policies (`study_tasks_select_own`, `study_tasks_insert_own`) from HU05 are unchanged and already support this HU's listing and detail-view requirements.

**Enforcement note**: unlike when HU04 added the equivalent policies for subjects (which still used a service-role client that bypasses RLS), this HU's repository functions use the request-scoped client (`requireRequestSupabaseClient`) throughout, so these policies are actually evaluated by Postgres on every request, not just present-but-dormant.

## Migration

`supabase/migrations/20260820000000_study_tasks_update_delete_policies.sql`:

```sql
create policy study_tasks_update_own
  on public.study_tasks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy study_tasks_delete_own
  on public.study_tasks
  for delete
  using (auth.uid() = user_id);
```

`supabase/migrations/20260820020000_study_tasks_subject_cascade_delete.sql` (amendment):

```sql
alter table public.study_tasks
  drop constraint study_tasks_subject_id_fkey;

alter table public.study_tasks
  add constraint study_tasks_subject_id_fkey
  foreign key (subject_id) references public.subjects (id) on delete cascade;
```

## State Transitions

- Task lifecycle, extended from HU05: `(does not exist)` → `created (pending)` → `updated` (zero or more times, via `PATCH`, including `pending` ↔ `completed` status transitions) → `deleted` (via `DELETE`) → `(does not exist)`.
- Update validation state: `unvalidated partial input` → `validated UpdateStudyTaskSchema payload (≥1 of title/description/dueDate/status present)` or `rejected (422)`.
- Authorization/existence state for detail view, update, and delete: `request (id, principal)` → `owned-and-existing (row returned/affected)` or `not-owned-or-nonexistent (no row returned / 0 rows affected → 404 NOT_FOUND)`, indistinguishable to the caller.
