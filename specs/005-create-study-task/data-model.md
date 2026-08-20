# Data Model: Create Study Task

> **Amended by HU06 (2026-08-20)**: this document originally specified `subject_id` with **no** `on delete cascade` (deletion blocked while tasks exist, matching HU04's original rule). That was reversed — see `specs/006-manage-study-tasks/data-model.md` for the current, effective schema (`on delete cascade`) and `supabase/migrations/20260820020000_study_tasks_subject_cascade_delete.sql`.

## Overview

HU05 introduces the `study_tasks` table, owned per-student and scoped to a subject the same student owns, protected by the RLS conventions defined in TECH-03 (`docs/security/rls-strategy.md`). Only the operations needed for this HU (create, and read for the owner) are modeled; update/delete policies are deferred to HU06 (Manage Study Tasks).

## Entities

### Study Task

Represents a unit of work a student wants to complete for one of their subjects.

**Fields**

| Column        | Type          | Constraints                                                                 |
|---------------|---------------|-------------------------------------------------------------------------------|
| `id`          | `uuid`        | Primary key, default `gen_random_uuid()`                                      |
| `user_id`     | `uuid`        | Not null, references `auth.users(id)` on delete cascade                       |
| `subject_id`  | `uuid`        | Not null, references `subjects(id)` — **no** `on delete cascade` (deleting a subject with tasks is blocked; see `specs/005-manage-subjects/spec.md` FR-011) |
| `title`       | `text`        | Not null, trimmed length between 1 and 100 characters (DB check)              |
| `description` | `text`        | Nullable, length ≤ 500 characters when present (DB check)                     |
| `due_date`    | `date`        | Nullable, no additional restriction                                           |
| `status`      | `text`        | Not null, default `'pending'`, one of `'pending'` / `'completed'` (DB check)  |
| `created_at`  | `timestamptz` | Not null, default `now()`                                                     |

**Rules**

- `user_id` is set exclusively from the server-resolved authenticated principal (`requireAuthenticatedPrincipal`); it is never accepted from client input (FR-009).
- `subject_id` must reference a subject owned by the same `user_id`; verified at the application layer before insert and re-checked by the `INSERT` RLS policy (FR-008).
- `title` must be non-empty after trimming and at most 100 characters (FR-002, FR-003).
- `description` is optional; when provided, it must be at most 500 characters (FR-004, FR-005).
- `due_date` is optional; any syntactically valid date is accepted (FR-006).
- `status` is always `'pending'` on creation; the client cannot set any other initial value (FR-007). Transitioning to `'completed'` is out of scope for this HU (delivered by HU06).
- A task always belongs to exactly one subject, owned by the same student who owns the task.

## Row Level Security

RLS is enabled on `study_tasks`. Policies scoped to this HU:

- **INSERT** (`study_tasks_insert_own`): `WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = subject_id AND s.user_id = auth.uid()))` — a row can only be inserted with the caller's own id as owner, and only when the referenced subject also belongs to the caller.
- **SELECT** (`study_tasks_select_own`): `USING (auth.uid() = user_id)` — a caller can only read rows they own (supports HU06's future listing work and lets ownership be verified independently of the application layer).

No `UPDATE`/`DELETE` policies are defined yet; in their absence, RLS denies those operations entirely, which is the correct default until HU06 defines them.

## Migration

`supabase/migrations/20260819000000_create_study_tasks_table.sql`:

```sql
create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id),
  title text not null,
  description text,
  due_date date,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint study_tasks_title_length check (char_length(btrim(title)) between 1 and 100),
  constraint study_tasks_description_length check (description is null or char_length(description) <= 500),
  constraint study_tasks_status_values check (status in ('pending', 'completed'))
);

alter table public.study_tasks enable row level security;

create policy study_tasks_select_own
  on public.study_tasks
  for select
  using (auth.uid() = user_id);

create policy study_tasks_insert_own
  on public.study_tasks
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subjects s
      where s.id = subject_id
        and s.user_id = auth.uid()
    )
  );
```

## State Transitions

- Task lifecycle for this HU: `(does not exist)` → `created` with `status = 'pending'` (via valid `POST /api/tasks`). No further states are modeled until HU06 (edit/status-change/delete) exists.
- Request validation state: `unvalidated input` → `validated CreateStudyTaskSchema payload` or `rejected (422)`.
- Authorization state: `unauthenticated` → `rejected (401)`; `authenticated` → `owner derived from principal` → `subject ownership verified` → `persisted`, or `rejected (404)` if the referenced subject is not owned by the principal.
