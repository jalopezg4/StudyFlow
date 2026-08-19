# Data Model: Manage Existing Subjects

## Overview

HU04 does not change the `subjects` table's columns. It extends the row-level security policy set (adding `UPDATE`/`DELETE`) and documents a forward-looking foreign-key contract that a future `study_tasks` feature must honor for the deletion dependency rule (business rule 3 / FR-010, FR-011) to hold.

## Entities

### Subject (unchanged shape, extended access rules)

Represents a course or area of study a student uses to organize tasks and sessions. Introduced in HU03 (`specs/004-subject-management/data-model.md`); no new columns here.

**Fields** (unchanged from HU03)

| Column        | Type          | Constraints                                                        |
|---------------|---------------|---------------------------------------------------------------------|
| `id`          | `uuid`        | Primary key, default `gen_random_uuid()`                            |
| `user_id`     | `uuid`        | Not null, references `auth.users(id)` on delete cascade             |
| `name`        | `text`        | Not null, trimmed length between 1 and 100 characters (DB check)    |
| `description` | `text`        | Nullable, length ≤ 500 characters when present (DB check)           |
| `created_at`  | `timestamptz` | Not null, default `now()`                                           |

**New access rules for this HU**

- Listing (`GET /api/subjects`) MUST return only rows where `user_id` equals the authenticated principal's id (FR-001, FR-002).
- Detail view (`GET /api/subjects/:id`) MUST return the subject only when `id` and `user_id` both match the request and the authenticated principal, respectively, using the same single scoped query as update/delete below — never a separate fetch-then-compare step (FR-002, FR-006, FR-007, US3 AC3, Decision 2/8 in `research.md`).
- Update (`PATCH /api/subjects/:id`) MUST apply only when `id` and `user_id` both match the request (target row) and the authenticated principal, respectively; this is enforced as a single scoped query, not a separate ownership-comparison step (FR-003, FR-004, FR-006, FR-007, Decision 2 in `research.md`).
- Delete (`DELETE /api/subjects/:id`) MUST apply under the same scoping rule, and additionally MUST be blocked when the subject has one or more associated study tasks (FR-010, FR-011) — see "Dependency Contract" below.
- A request targeting an `id` that either does not exist or belongs to a different student MUST produce the same outcome (a generic not-found response) for detail view, update, and delete alike, never a distinguishable "forbidden" vs. "not found" pair (FR-007).

### Study Task *(not created by this spec — forward contract only)*

This spec references, but does not define or create, a `study_tasks` entity. It exists here only to document the constraint any future study-task migration must satisfy so that HU04's deletion-blocking behavior (business rule 3) works without further changes to the `subjects` code path.

**Required forward contract** (to be implemented by the future study-task feature, not by HU04):

```sql
-- Illustrative only — NOT created by this migration/spec.
-- The future study_tasks table MUST declare subject_id this way:
subject_id uuid not null references public.subjects (id) on delete restrict
```

- `on delete restrict` (the default FK behavior) is what makes a subject-delete attempt fail with a foreign-key-violation while dependent tasks exist — this is the actual mechanism behind FR-010/FR-011, not application code in the `subjects` feature.
- Until this table exists, no subject can have any associated study tasks, so every delete of an owned subject succeeds (see `research.md` Decision 4 and the spec's Assumptions section).

## Row Level Security

RLS is already enabled on `subjects` (from HU03). This HU adds two policies:

- **UPDATE** (`subjects_update_own`): `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` — a caller can only update rows they own, and cannot use an update to reassign a row to a different owner.
- **DELETE** (`subjects_delete_own`): `USING (auth.uid() = user_id)` — a caller can only delete rows they own.

The existing `SELECT`/`INSERT` policies (`subjects_select_own`, `subjects_insert_own`) from HU03 are unchanged and already support both this HU's listing requirement and its new detail-view-by-id requirement — no new `SELECT` policy is needed for `GET /api/subjects/:id`.

## Migration

`supabase/migrations/20260818010000_subjects_update_delete_policies.sql`:

```sql
-- HU04: add UPDATE/DELETE RLS policies for subjects (no column changes)
create policy subjects_update_own
  on public.subjects
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy subjects_delete_own
  on public.subjects
  for delete
  using (auth.uid() = user_id);
```

## State Transitions

- Subject lifecycle, extended from HU03: `(does not exist)` → `created` → `updated` (zero or more times, via `PATCH`) → `deleted` (via `DELETE`, only when eligible) → `(does not exist)`.
- Update validation state: `unvalidated partial input` → `validated UpdateSubjectSchema payload (≥1 field present)` or `rejected (422)`.
- Delete eligibility state: `no associated study tasks` → `deletable`; `≥1 associated study task` (once that entity exists) → `deletion blocked (409 CONFLICT)`.
- Authorization/existence state for detail view, update, and delete: `request (id, principal)` → `owned-and-existing (row returned/affected)` or `not-owned-or-nonexistent (no row returned / 0 rows affected → 404 NOT_FOUND)`, indistinguishable to the caller.
