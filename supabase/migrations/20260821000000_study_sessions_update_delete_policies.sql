-- HU11: allow owners to manage their own study sessions
create policy study_sessions_update_own
  on public.study_sessions
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subjects s
      where s.id = subject_id
        and s.user_id = auth.uid()
    )
    and (
      task_id is null
      or exists (
        select 1 from public.study_tasks t
        where t.id = task_id
          and t.user_id = auth.uid()
          and t.subject_id = study_sessions.subject_id
      )
    )
  );

create policy study_sessions_delete_own
  on public.study_sessions
  for delete
  using (auth.uid() = user_id);
