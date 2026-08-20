import { defineEventHandler, readBody, setResponseStatus, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { validateWithSchema } from '../../utils/security/validation'
import { executeProtectedHandler } from '../security/_shared'
import { CreateSubjectSchema } from '../../utils/subjects/schemas'
import { createSubject } from '../../utils/subjects/repository'

export async function handleCreateSubject(event: H3Event, rawBody: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const body = validateWithSchema(CreateSubjectSchema, rawBody, 'body')
  const subject = await createSubject(supabase, principal.userId, body)

  return { status: 'created' as const, subject }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, async () => {
    const result = await handleCreateSubject(event, await readBody(event))
    setResponseStatus(event, 201)
    return result
  })
})
