import { defineEventHandler, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { listStudyTasksForOwner } from '../../utils/tasks/repository'

export async function handleListStudyTasks(event: H3Event) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const tasks = await listStudyTasksForOwner(supabase, principal.userId)

  return { status: 'ok' as const, tasks }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, () => handleListStudyTasks(event))
})
