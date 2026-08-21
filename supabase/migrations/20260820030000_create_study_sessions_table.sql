-- HU09: study session records owned by the authenticated student
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  task_id uuid references public.study_tasks (id) on delete cascade,
  duration_minutes integer not null,
  created_at timestamptz not null default now(),
  constraint study_sessions_duration_minutes_range check (duration_minutes between 1 and 1440)
);

alter table public.study_sessions enable row level security;

create policy study_sessions_select_own
  on public.study_sessions
  for select
  using (auth.uid() = user_id);

create policy study_sessions_insert_own
  on public.study_sessions
  for insert
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
