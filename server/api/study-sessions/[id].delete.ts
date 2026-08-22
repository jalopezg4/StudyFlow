import { defineEventHandler, getRouterParam, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { parseStudySessionId } from '../../utils/study-sessions/schemas'
import { deleteStudySession } from '../../utils/study-sessions/repository'

export async function handleDeleteStudySession(event: H3Event, rawId: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const id = parseStudySessionId(rawId)
  await deleteStudySession(requireRequestSupabaseClient(event), principal.userId, id)
  return { status: 'deleted' as const, id }
}

export default defineEventHandler((event) => executeProtectedHandler(event, () =>
  handleDeleteStudySession(event, { id: getRouterParam(event, 'id') })
))
