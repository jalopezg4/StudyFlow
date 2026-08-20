import { defineEventHandler, getRouterParam, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { createSafeHttpError } from '../../utils/security/errors'
import { executeProtectedHandler } from '../security/_shared'
import { parseSubjectId } from '../../utils/subjects/schemas'
import { getSubjectForOwner } from '../../utils/subjects/repository'

export async function handleGetSubject(event: H3Event, rawParams: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const id = parseSubjectId(rawParams)
  const subject = await getSubjectForOwner(supabase, principal.userId, id)

  if (!subject) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Subject not found')
  }

  return { status: 'ok' as const, subject }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, () =>
    handleGetSubject(event, { id: getRouterParam(event, 'id') })
  )
})
