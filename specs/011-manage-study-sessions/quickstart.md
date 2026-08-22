# Quickstart: Manage Study Sessions

1. Apply `20260821000000_study_sessions_update_delete_policies.sql` in Supabase SQL Editor.
2. Sign in and open `/study-sessions`.
3. Register a session, then confirm it appears under **Recorded sessions**.
4. Select **Edit**, change the duration, and save.
5. Return to `/dashboard` and confirm total minutes reflect the edited value.
6. Select **Delete** and confirm the session disappears and dashboard totals decrease.
7. Sign in as another user and verify the first user's sessions are not listed or editable.
8. Verify duration values `0`, `-5`, `1.5`, and `1441` are rejected.

Automated checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Live Supabase/RLS validation requires configured environment credentials and two authenticated users.
