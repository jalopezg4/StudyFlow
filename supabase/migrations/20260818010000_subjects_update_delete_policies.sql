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
