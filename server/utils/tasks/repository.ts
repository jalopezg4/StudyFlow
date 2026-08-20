import type { SupabaseClient } from '@supabase/supabase-js'
import { createSafeHttpError } from '../security/errors'
import type { CreateStudyTaskInput, UpdateStudyTaskInput } from './schemas'

export interface StudyTask {
  id: string
  subjectId: string
  subjectName: string
  title: string
  description: string | null
  dueDate: string | null
  status: 'pending' | 'completed'
  createdAt: string
}

interface StudyTaskRow {
  id: string
  subject_id: string
  title: string
  description: string | null
  due_date: string | null
  status: 'pending' | 'completed'
  created_at: string
  // PostgREST returns a to-one embed (via the subject_id FK column on this
  // table) as a single object, not an array — unlike the reverse, to-many
  // `study_tasks(count)` embed used on the subjects side.
  subjects: { name: string } | null
}

// Embeds the owning subject's name via the subject_id foreign key so the
// client can show "which subject is this task under" without a second
// round trip (previously omitted entirely — the task list showed no
// subject relationship at all).
const TASK_COLUMNS = 'id, subject_id, title, description, due_date, status, created_at, subjects(name)'

function toStudyTask(row: StudyTaskRow): StudyTask {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: row.subjects?.name ?? '',
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
    createdAt: row.created_at
  }
}

export async function createStudyTask(
  supabase: SupabaseClient,
  userId: string,
  input: CreateStudyTaskInput
): Promise<StudyTask> {
  const { data, error } = await supabase
    .from('study_tasks')
    .insert({
      user_id: userId,
      subject_id: input.subjectId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ?? null
    })
    .select(TASK_COLUMNS)
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create study task')
  }

  return toStudyTask(data as unknown as StudyTaskRow)
}

export async function listStudyTasksForOwner(
  supabase: SupabaseClient,
  userId: string
): Promise<StudyTask[]> {
  const { data, error } = await supabase
    .from('study_tasks')
    .select(TASK_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as StudyTaskRow[]).map(toStudyTask)
}

export async function getStudyTaskForOwner(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<StudyTask | null> {
  const { data, error } = await supabase
    .from('study_tasks')
    .select(TASK_COLUMNS)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? toStudyTask(data as unknown as StudyTaskRow) : null
}

export async function updateStudyTask(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  patch: UpdateStudyTaskInput
): Promise<StudyTask> {
  const updatePayload: Record<string, string | null> = {}
  if (patch.title !== undefined) {
    updatePayload.title = patch.title
  }
  if (patch.description !== undefined) {
    updatePayload.description = patch.description
  }
  if (patch.dueDate !== undefined) {
    updatePayload.due_date = patch.dueDate
  }
  if (patch.status !== undefined) {
    updatePayload.status = patch.status
  }

  const { data, error } = await supabase
    .from('study_tasks')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select(TASK_COLUMNS)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Study task not found')
  }

  return toStudyTask(data as unknown as StudyTaskRow)
}

export async function deleteStudyTask(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { data, error } = await supabase
    .from('study_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Study task not found')
  }
}
