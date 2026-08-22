import { defineEventHandler, getRouterParam, readBody, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { validateWithSchema } from '../../utils/security/validation'
import { parseStudySessionId, UpdateStudySessionSchema } from '../../utils/study-sessions/schemas'
import { updateStudySession } from '../../utils/study-sessions/repository'

export async function handleUpdateStudySession(event: H3Event, rawBody: unknown, rawId: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const id = parseStudySessionId(rawId)
  const patch = validateWithSchema(UpdateStudySessionSchema, rawBody, 'body')
  const session = await updateStudySession(requireRequestSupabaseClient(event), principal.userId, id, patch)
  return { status: 'updated' as const, studySession: session }
}

export default defineEventHandler((event) => executeProtectedHandler(event, () =>
  handleUpdateStudySession(event, readBody(event), { id: getRouterParam(event, 'id') })
))
