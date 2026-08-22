import type { SupabaseClient } from '@supabase/supabase-js'
import { createSafeHttpError } from '../security/errors'
import type { CreateStudySessionInput, UpdateStudySessionInput } from './schemas'

export interface StudySession {
  id: string
  subjectId: string
  taskId: string | null
  durationMinutes: number
  createdAt: string
}

interface StudySessionRow {
  id: string
  subject_id: string
  task_id: string | null
  duration_minutes: number
  created_at: string
}

const SESSION_COLUMNS = 'id, subject_id, task_id, duration_minutes, created_at'

function toStudySession(row: StudySessionRow): StudySession {
  return {
    id: row.id,
    subjectId: row.subject_id,
    taskId: row.task_id,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at
  }
}

export async function createStudySession(
  supabase: SupabaseClient,
  userId: string,
  input: CreateStudySessionInput
): Promise<StudySession> {
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', input.subjectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (subjectError) {
    throw new Error(subjectError.message)
  }

  if (!subject) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Subject not found')
  }

  if (input.taskId !== undefined) {
    const { data: task, error: taskError } = await supabase
      .from('study_tasks')
      .select('id, subject_id')
      .eq('id', input.taskId)
      .eq('user_id', userId)
      .eq('subject_id', input.subjectId)
      .maybeSingle()

    if (taskError) {
      throw new Error(taskError.message)
    }

    if (!task) {
      throw createSafeHttpError(404, 'NOT_FOUND', 'Study task not found')
    }
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userId,
      subject_id: input.subjectId,
      task_id: input.taskId ?? null,
      duration_minutes: input.durationMinutes
    })
    .select(SESSION_COLUMNS)
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create study session')
  }

  return toStudySession(data as unknown as StudySessionRow)
}

export async function listStudySessionsForOwner(
  supabase: SupabaseClient,
  userId: string
): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select(SESSION_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as StudySessionRow[]).map(toStudySession)
}

async function verifySessionResources(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
  taskId: string | null | undefined
): Promise<void> {
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subjectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (subjectError) throw new Error(subjectError.message)
  if (!subject) throw createSafeHttpError(404, 'NOT_FOUND', 'Subject not found')

  if (taskId) {
    const { data: task, error: taskError } = await supabase
      .from('study_tasks')
      .select('id')
      .eq('id', taskId)
      .eq('user_id', userId)
      .eq('subject_id', subjectId)
      .maybeSingle()

    if (taskError) throw new Error(taskError.message)
    if (!task) throw createSafeHttpError(404, 'NOT_FOUND', 'Study task not found')
  }
}

export async function updateStudySession(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  patch: UpdateStudySessionInput
): Promise<StudySession> {
  const { data: current, error: currentError } = await supabase
    .from('study_sessions')
    .select('subject_id, task_id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (currentError) throw new Error(currentError.message)
  if (!current) throw createSafeHttpError(404, 'NOT_FOUND', 'Study session not found')

  const subjectId = patch.subjectId ?? current.subject_id
  const taskId = patch.taskId === undefined ? current.task_id : patch.taskId
  await verifySessionResources(supabase, userId, subjectId, taskId)

  const updatePayload: Record<string, string | number | null> = {}
  if (patch.subjectId !== undefined) updatePayload.subject_id = patch.subjectId
  if (patch.taskId !== undefined) updatePayload.task_id = patch.taskId
  if (patch.durationMinutes !== undefined) updatePayload.duration_minutes = patch.durationMinutes

  const { data, error } = await supabase
    .from('study_sessions')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select(SESSION_COLUMNS)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw createSafeHttpError(404, 'NOT_FOUND', 'Study session not found')

  return toStudySession(data as unknown as StudySessionRow)
}

export async function deleteStudySession(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { data, error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw createSafeHttpError(404, 'NOT_FOUND', 'Study session not found')
}
