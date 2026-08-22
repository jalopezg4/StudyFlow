# Tasks: Manage Study Sessions

- [x] T001 Add update/delete RLS policies in `supabase/migrations/20260821000000_study_sessions_update_delete_policies.sql`
- [x] T002 Add `TaskIdParamSchema` and `UpdateStudySessionSchema` in `server/utils/study-sessions/schemas.ts`
- [x] T003 Add owner-scoped list, update, and delete operations in `server/utils/study-sessions/repository.ts`
- [x] T004 Add protected `GET /api/study-sessions` in `server/api/study-sessions/index.get.ts`
- [x] T005 Add protected `PATCH /api/study-sessions/:id` in `server/api/study-sessions/[id].patch.ts`
- [x] T006 Add protected `DELETE /api/study-sessions/:id` in `server/api/study-sessions/[id].delete.ts`
- [x] T007 Add session history and edit/delete controls to `app/components/study-sessions/StudySessionList.vue`
- [x] T008 Add the list to `app/pages/study-sessions/index.vue`
- [x] T009 Add route, repository, ownership, and validation tests under `tests/study-sessions/`
- [x] T010 Run lint, typecheck, test, and build; document evidence in this file

## Validation Evidence

- `npx vitest run tests/study-sessions`: passed, 26 tests.
- `npm run lint`: passed with one pre-existing warning in `app/components/PasswordInput.vue`.
- `npm run typecheck`: passed.
- Live Supabase/RLS validation remains pending until the migration is applied to the remote project.
