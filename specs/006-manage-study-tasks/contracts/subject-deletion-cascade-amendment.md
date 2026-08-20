# Amendment: Subject Endpoints (Cascade Delete + taskCount)

## Purpose

Document how this HU changes the existing subjects contract (`specs/005-manage-subjects/contracts/subject-management-crud-contract.md`), rather than duplicating that whole document. Only the differences are listed here.

## `GET /api/subjects` and `GET /api/subjects/:id` — response shape gains `taskCount`

```jsonc
{
  "status": "ok",
  "subject": {
    "id": "uuid",
    "name": "Calculus I",
    "description": "Optional note",
    "createdAt": "2026-08-18T00:00:00.000Z",
    "taskCount": 3   // NEW — number of study tasks currently under this subject
  }
}
```

- `taskCount` is a plain count of the student's own study tasks referencing this subject (always 0 or more, never null).
- Purpose: lets the client warn the student, before they confirm deleting a subject, how many tasks will be deleted along with it (FR-013).

## `DELETE /api/subjects/:id` — `409 CONFLICT` case removed

The original HU04 contract documented a `409 CONFLICT` response when the subject had associated study tasks. That case **no longer exists**: deletion now always cascades (subject to normal auth/ownership checks). The response table becomes:

| Status | Code               | Trigger                                                                 |
|--------|--------------------|--------------------------------------------------------------------------|
| 401    | `UNAUTHENTICATED`  | No valid authenticated session.                                         |
| 404    | `NOT_FOUND`        | The `id` does not exist, or belongs to a different student.             |
| 500    | `INTERNAL_ERROR`   | Unexpected failure; no internal details leaked.                        |

Success response (`200 OK`, `{ "status": "deleted", "id": "uuid" }`) is unchanged, and now also implies every study task that referenced this subject was deleted along with it.

## Traceability

- Original contract (amended by this document): `specs/005-manage-subjects/contracts/subject-management-crud-contract.md`
- Decision record: `specs/006-manage-study-tasks/spec.md` Clarifications (second session), FR-013
- Data model: `specs/006-manage-study-tasks/data-model.md` "Amendment: Subject Deletion Cascade"
- Migration: `supabase/migrations/20260820020000_study_tasks_subject_cascade_delete.sql`
- Repository: `server/utils/subjects/repository.ts`
- UI: `app/components/subjects/SubjectList.vue` (delete-confirmation warning)
