# Data Model: Subject Management

## Overview

HU03 introduces the first product domain table, `subjects`, owned per-student and protected by the RLS conventions defined in TECH-03 (`docs/security/rls-strategy.md`). Only the operations needed for this HU (create, and read for the owner) are modeled; update/delete policies are deferred to future subject-management stories.

## Entities

### Subject

Represents a course or area of study a student uses to organize tasks and sessions.

**Fields**

| Column        | Type          | Constraints                                                        |
|---------------|---------------|---------------------------------------------------------------------|
| `id`          | `uuid`        | Primary key, default `gen_random_uuid()`                            |
| `user_id`     | `uuid`        | Not null, references `auth.users(id)` on delete cascade             |
| `name`        | `text`        | Not null, trimmed length between 1 and 100 characters (DB check)    |
| `description` | `text`        | Nullable, length ≤ 500 characters when present (DB check)           |
| `created_at`  | `timestamptz` | Not null, default `now()`                                           |

**Rules**

- `user_id` is set exclusively from the server-resolved authenticated principal (`requireAuthenticatedPrincipal`); it is never accepted from client input (FR-006, FR-007).
- `name` must be non-empty after trimming and at most 100 characters (FR-002, FR-003).
- `description` is optional; when provided, it must be at most 500 characters (FR-004, FR-005).
- Duplicate `name` values for the same `user_id` are permitted (no uniqueness constraint), per the spec's clarification.
- A subject always belongs to exactly one student; a student may own any number of subjects.

## Row Level Security

RLS is enabled on `subjects`. Policies scoped to this HU:

- **INSERT** (`subjects_insert_own`): `WITH CHECK (auth.uid() = user_id)` — a row can only be inserted with the caller's own id as owner.
- **SELECT** (`subjects_select_own`): `USING (auth.uid() = user_id)` — a caller can only read rows they own (supports future listing work and lets ownership be verified independently of the application layer).

No `UPDATE`/`DELETE` policies are defined yet; in their absence, RLS denies those operations entirely, which is the correct default until an edit/delete user story defines them.

## Migration

`supabase/migrations/20260818000000_create_subjects_table.sql`:

```sql
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint subjects_name_length check (char_length(btrim(name)) between 1 and 100),
  constraint subjects_description_length check (description is null or char_length(description) <= 500)
);

alter table public.subjects enable row level security;

create policy subjects_select_own
  on public.subjects
  for select
  using (auth.uid() = user_id);

create policy subjects_insert_own
  on public.subjects
  for insert
  with check (auth.uid() = user_id);
```

## State Transitions

- Subject lifecycle for this HU: `(does not exist)` → `created` (via valid `POST /api/subjects`). No further states are modeled until edit/delete/listing stories exist.
- Request validation state: `unvalidated input` → `validated CreateSubjectSchema payload` or `rejected (422)`.
- Authorization state: `unauthenticated` → `rejected (401)`; `authenticated` → `owner derived from principal` → `persisted`.
