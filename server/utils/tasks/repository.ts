import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CreateStudyTaskInput } from './schemas'

export interface StudyTask {
  id: string
  subjectId: string
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

function toStudyTask(row: StudyTaskRow): StudyTask {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
    createdAt: row.created_at
  }
}

export async function createStudyTask(
  userId: string,
  input: CreateStudyTaskInput
): Promise<StudyTask> {
  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from('study_tasks')
    .insert({
      user_id: userId,
      subject_id: input.subjectId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ?? null
    })
    .select('id, subject_id, title, description, due_date, status, created_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create study task')
  }

  return toStudyTask(data as StudyTaskRow)
}
