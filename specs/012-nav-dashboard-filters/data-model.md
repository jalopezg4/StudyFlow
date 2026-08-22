# Phase 1 Data Model: Navigation, Dashboard Labels & Filter Reset

**No new or modified entities.** This feature is presentation-layer only.

- **Navigation link** (existing, in-memory only): `AppNav.vue`'s `links` array gains one more `{ label, path }` entry. This is local component state, not a persisted or transmitted entity — it has no relationship to Subject, StudyTask, or StudySession.
- **Task filters** (existing, in-memory only): `TaskList.vue`'s `filters` reactive object (`status`, `subjectId`, `sortBy`, `sortDir`) is reset to its already-existing default values. No new field is added to it, and its shape is unchanged from the filtering feature that introduced it (`specs/007-filter-sort-study-tasks`).

No table, column, migration, or Supabase RLS policy is added, changed, or removed by this feature. No API request/response shape changes — the `/api/tasks` call this feature triggers on "Clear filters" is the exact same call `TaskList.vue` already makes on every filter change.
