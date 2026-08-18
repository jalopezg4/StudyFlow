-- HU03: subjects table with ownership + RLS (create/select only for this iteration)
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint subjects_name_length check (char_length(btrim(name)) between 1 and 100),
  constraint subjects_description_length check (description is null or char_length(description) <= 500)
);

alter table public.subjects enable row level security;

create policy subjects_select_own
  on public.subjects
  for select
  using (auth.uid() = user_id);

create policy subjects_insert_own
  on public.subjects
  for insert
  with check (auth.uid() = user_id);
