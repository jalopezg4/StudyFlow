import { defineEventHandler, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { getRecommendedTaskForOwner } from '../../utils/tasks/repository'

export async function handleGetRecommendation(event: H3Event) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const task = await getRecommendedTaskForOwner(supabase, principal.userId)

  return { status: 'ok' as const, task }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, () => handleGetRecommendation(event))
})
