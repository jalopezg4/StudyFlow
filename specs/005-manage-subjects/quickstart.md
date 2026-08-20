# Quickstart: Manage Existing Subjects Validation

## Purpose

Validate that HU04 lets an authenticated student list, view, edit, and delete only their own subjects; denies cross-student access (including direct detail-view-by-id) without revealing existence; and blocks deletion of a subject with associated study tasks.

## Prerequisites

- Everything from `specs/004-subject-management/quickstart.md` (repo cloned, `npm ci`, `.env` from `.env.example`, HU03's `subjects` migration applied).
- This HU's additional migration applied: `supabase/migrations/20260818010000_subjects_update_delete_policies.sql` (via `supabase db push` or the Supabase SQL editor).

## Known Limitation (until HU01 ships)

Same as HU03: there is no real login UI yet, so a manual browser walkthrough cannot produce a genuine authenticated session. All scenarios below are exercised via the automated Vitest suite using the existing `createTestEvent`-style authenticated-event fixture (`tests/security/fixtures.ts`). Once HU01 ships, extend this quickstart with a manual "sign in as Student A, list/edit/delete, sign in as Student B, confirm denial" walkthrough.

## Validation Scenarios

### 1. List only my own subjects (CA01)

1. Run `tests/subjects/list-subjects.spec.ts`: seed subjects for two distinct authenticated principals, request the listing as each.
2. Confirm each response contains exactly that principal's subjects and never the other's.

**Expected outcome**: `GET /api/subjects` returns only the requesting student's subjects (SC-001).

### 2. View one of my own subjects by id (CA03 AC3, positive case)

1. Run `tests/subjects/get-subject.spec.ts`'s owned-subject case: create a subject as a given principal, then request `GET /api/subjects/:id` for that id as the same principal.
2. Confirm the response contains that subject's current name/description.

**Expected outcome**: The owning student can retrieve a single subject by id; the response shape matches the listing's per-subject shape.

### 3. Edit my own subject (CA02)

1. Run `tests/subjects/update-subject.spec.ts` cases: name-only update, description-only update, both fields, and the empty-body rejection case.
2. Also run the reused validation cases (empty name, whitespace-only name, over-length name, over-length description) against `PATCH`.
3. Confirm a successful update returns the new values in the same response, and a rejected update leaves the stored row unchanged.

**Expected outcome**: Valid partial updates persist and are reflected immediately; invalid updates are rejected with `422 VALIDATION_ERROR` and change nothing (SC-002).

### 4. Cross-student access is denied without existence disclosure (CA03)

1. Run the extended `tests/subjects/ownership.spec.ts` cases: Student B attempts `GET` (detail view), `PATCH`, and `DELETE` on a subject owned by Student A, and also attempts each operation on an id that does not exist at all.
2. Confirm the "owned by someone else" case and the "does not exist" case return the identical `404 NOT_FOUND` response shape for all three operations, and that Student A's subject is unchanged afterward.

**Expected outcome**: The server denies the operation, makes no change, and never reveals whether a given id belongs to another student — including via the direct detail-view attempt described in US3 AC3 (SC-003).

### 5. Delete an eligible subject (CA04, allowed case)

1. Run `tests/subjects/delete-subject.spec.ts`'s "no associated tasks" case: create a subject, delete it, then confirm it is absent from a subsequent listing for that same student.

**Expected outcome**: The subject is removed from persistence and no longer appears in the owner's listing, in the same session (SC-005).

### 6. Delete is blocked when tasks are associated (CA04, blocked case)

1. Run `tests/subjects/delete-subject.spec.ts`'s "blocked by dependency" case. Since `study_tasks` does not exist yet in this codebase, this case is expressed as a repository-level test that simulates the foreign-key-violation error path (Postgres error code `23503`) that will occur naturally once the future study-task migration's `on delete restrict` FK is in place, and asserts it is translated into `409 CONFLICT` without deleting the subject.
2. Once a future study-task feature ships a real `study_tasks` table with the FK contract documented in `data-model.md`, re-run this scenario end-to-end against a genuinely dependent row instead of the simulated error path.

**Expected outcome**: Zero subjects with associated tasks are ever deleted (SC-004).

## Standard Validation Commands

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

**Expected outcome**: All commands pass after HU04 implementation.

## Subject Feature Files

- `server/api/subjects/index.get.ts`
- `server/api/subjects/[id].get.ts`
- `server/api/subjects/[id].patch.ts`
- `server/api/subjects/[id].delete.ts`
- `server/utils/subjects/schemas.ts`
- `server/utils/subjects/repository.ts`
- `server/utils/security/types.ts`
- `server/utils/security/errors.ts`
- `app/components/subjects/SubjectList.vue`
- `app/components/subjects/SubjectEditForm.vue`
- `app/pages/subjects/index.vue`
- `tests/subjects/list-subjects.spec.ts`
- `tests/subjects/get-subject.spec.ts`
- `tests/subjects/update-subject.spec.ts`
- `tests/subjects/delete-subject.spec.ts`
- `tests/subjects/ownership.spec.ts` (extended)
