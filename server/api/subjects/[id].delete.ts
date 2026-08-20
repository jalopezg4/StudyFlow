import { defineEventHandler, getRouterParam, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { parseSubjectId } from '../../utils/subjects/schemas'
import { deleteSubject } from '../../utils/subjects/repository'

export async function handleDeleteSubject(event: H3Event, rawParams: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const id = parseSubjectId(rawParams)
  await deleteSubject(supabase, principal.userId, id)

  return { status: 'deleted' as const, id }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, () =>
    handleDeleteSubject(event, { id: getRouterParam(event, 'id') })
  )
})
