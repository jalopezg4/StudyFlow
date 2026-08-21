import { defineEventHandler, readBody, setResponseStatus, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { validateWithSchema } from '../../utils/security/validation'
import { CreateStudySessionSchema } from '../../utils/study-sessions/schemas'
import { createStudySession } from '../../utils/study-sessions/repository'

export async function handleCreateStudySession(event: H3Event, rawBody: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const body = validateWithSchema(CreateStudySessionSchema, rawBody, 'body')
  const studySession = await createStudySession(supabase, principal.userId, body)

  return { status: 'created' as const, studySession }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, async () => {
    const result = await handleCreateStudySession(event, await readBody(event))
    setResponseStatus(event, 201)
    return result
  })
})
