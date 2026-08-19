import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSafeHttpError } from '../security/errors'
import type { CreateSubjectInput, UpdateSubjectInput } from './schemas'

export interface Subject {
  id: string
  name: string
  description: string | null
  createdAt: string
}

interface SubjectRow {
  id: string
  name: string
  description: string | null
  created_at: string
}

let cachedClient: SupabaseClient | null = null

function getServiceRoleClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient
  }

  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase server configuration is missing')
  }

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })

  return cachedClient
}

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at
  }
}

export async function createSubject(userId: string, input: CreateSubjectInput): Promise<Subject> {
  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? null
    })
    .select('id, name, description, created_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create subject')
  }

  return toSubject(data as SubjectRow)
}

export async function listSubjectsForOwner(userId: string): Promise<Subject[]> {
  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as SubjectRow[]).map(toSubject)
}

export async function getSubjectForOwner(userId: string, id: string): Promise<Subject | null> {
  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, description, created_at')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? toSubject(data as SubjectRow) : null
}

export async function updateSubject(
  userId: string,
  id: string,
  patch: UpdateSubjectInput
): Promise<Subject> {
  const supabase = getServiceRoleClient()

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
    .select('id, name, description, created_at')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Subject not found')
  }

  return toSubject(data as SubjectRow)
}

export async function deleteSubject(userId: string, id: string): Promise<void> {
  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    if (error.code === '23503') {
      throw createSafeHttpError(
        409,
        'CONFLICT',
        'Subject has associated study tasks and cannot be deleted'
      )
    }
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Subject not found')
  }
}
