import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CreateSubjectInput } from './schemas'

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
