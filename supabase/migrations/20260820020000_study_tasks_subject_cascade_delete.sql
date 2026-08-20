-- HU06 amendment: deleting a subject now cascades to delete its study tasks,
-- reversing HU04's original "block deletion while tasks exist" rule.
-- See specs/006-manage-study-tasks/spec.md Clarifications and
-- specs/005-manage-subjects/spec.md's amendment note for the product decision.
alter table public.study_tasks
  drop constraint study_tasks_subject_id_fkey;

alter table public.study_tasks
  add constraint study_tasks_subject_id_fkey
  foreign key (subject_id) references public.subjects (id) on delete cascade;
