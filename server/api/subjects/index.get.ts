import { defineEventHandler, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { listSubjectsForOwner } from '../../utils/subjects/repository'

export async function handleListSubjects(event: H3Event) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const subjects = await listSubjectsForOwner(supabase, principal.userId)

  return { status: 'ok' as const, subjects }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, () => handleListSubjects(event))
})
