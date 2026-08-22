import { defineEventHandler, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { getProgressSummary } from '../../utils/dashboard/repository'

export async function handleGetProgress(event: H3Event) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const progress = await getProgressSummary(supabase, principal.userId)

  return { status: 'ok' as const, progress }
}

export default defineEventHandler((event) =>
  executeProtectedHandler(event, () => handleGetProgress(event))
)
