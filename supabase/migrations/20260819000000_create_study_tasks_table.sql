-- HU05: study_tasks table with ownership + subject scoping + RLS (create/select only for this iteration)
create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id),
  title text not null,
  description text,
  due_date date,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint study_tasks_title_length check (char_length(btrim(title)) between 1 and 100),
  constraint study_tasks_description_length check (description is null or char_length(description) <= 500),
  constraint study_tasks_status_values check (status in ('pending', 'completed'))
);

alter table public.study_tasks enable row level security;

create policy study_tasks_select_own
  on public.study_tasks
  for select
  using (auth.uid() = user_id);

create policy study_tasks_insert_own
  on public.study_tasks
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subjects s
      where s.id = subject_id
        and s.user_id = auth.uid()
    )
  );
