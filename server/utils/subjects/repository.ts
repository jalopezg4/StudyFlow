import type { SupabaseClient } from '@supabase/supabase-js'
import { createSafeHttpError } from '../security/errors'
import type { CreateSubjectInput, UpdateSubjectInput } from './schemas'

export interface Subject {
  id: string
  name: string
  description: string | null
  createdAt: string
  taskCount: number
}

interface SubjectRow {
  id: string
  name: string
  description: string | null
  created_at: string
  study_tasks: { count: number }[] | null
}

const SUBJECT_COLUMNS = 'id, name, description, created_at, study_tasks(count)'

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    taskCount: row.study_tasks?.[0]?.count ?? 0
  }
}

export async function createSubject(
  supabase: SupabaseClient,
  userId: string,
  input: CreateSubjectInput
): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? null
    })
    .select(SUBJECT_COLUMNS)
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create subject')
  }

  return toSubject(data as SubjectRow)
}

export async function listSubjectsForOwner(
  supabase: SupabaseClient,
  userId: string
): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select(SUBJECT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as SubjectRow[]).map(toSubject)
}

export async function getSubjectForOwner(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Subject | null> {
  const { data, error } = await supabase
    .from('subjects')
    .select(SUBJECT_COLUMNS)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? toSubject(data as SubjectRow) : null
}

export async function updateSubject(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  patch: UpdateSubjectInput
): Promise<Subject> {
  const updatePayload: Record<string, string> = {}
  if (patch.name !== undefined) {
    updatePayload.name = patch.name
  }
  if (patch.description !== undefined) {
    updatePayload.description = patch.description
  }

  const { data, error } = await supabase
    .from('subjects')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select(SUBJECT_COLUMNS)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Subject not found')
  }

  return toSubject(data as SubjectRow)
}

export async function deleteSubject(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  // Deleting a subject cascades to delete its study tasks at the database
  // level (see the HU06 cascade-delete migration) — the client is expected
  // to have already confirmed this with the student (Subject.taskCount is
  // surfaced for exactly that purpose), so no FK-violation case remains
  // here to translate into a 409 CONFLICT.
  const { data, error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Subject not found')
  }
}
