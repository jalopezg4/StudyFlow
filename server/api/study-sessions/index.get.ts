import { defineEventHandler, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { listStudySessionsForOwner } from '../../utils/study-sessions/repository'

export async function handleListStudySessions(event: H3Event) {
  const principal = requireAuthenticatedPrincipal(event)
  const sessions = await listStudySessionsForOwner(requireRequestSupabaseClient(event), principal.userId)
  return { status: 'ok' as const, sessions }
}

export default defineEventHandler((event) => executeProtectedHandler(event, () => handleListStudySessions(event)))
