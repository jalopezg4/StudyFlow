-- HU06: add UPDATE/DELETE RLS policies for study_tasks (no column changes)
create policy study_tasks_update_own
  on public.study_tasks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy study_tasks_delete_own
  on public.study_tasks
  for delete
  using (auth.uid() = user_id);
