import { defineEventHandler, getRouterParam, readBody, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { validateWithSchema } from '../../utils/security/validation'
import { executeProtectedHandler } from '../security/_shared'
import { parseSubjectId, UpdateSubjectSchema } from '../../utils/subjects/schemas'
import { updateSubject } from '../../utils/subjects/repository'

export async function handleUpdateSubject(event: H3Event, rawParams: unknown, rawBody: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const id = parseSubjectId(rawParams)
  const patch = validateWithSchema(UpdateSubjectSchema, rawBody, 'body')
  const subject = await updateSubject(supabase, principal.userId, id, patch)

  return { status: 'updated' as const, subject }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, async () =>
    handleUpdateSubject(event, { id: getRouterParam(event, 'id') }, await readBody(event))
  )
})
