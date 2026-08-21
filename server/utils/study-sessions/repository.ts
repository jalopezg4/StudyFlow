import type { SupabaseClient } from '@supabase/supabase-js'
import { createSafeHttpError } from '../security/errors'
import type { CreateStudySessionInput } from './schemas'

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
