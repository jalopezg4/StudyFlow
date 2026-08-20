import { defineEventHandler, getRouterParam, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { parseTaskId } from '../../utils/tasks/schemas'
import { deleteStudyTask } from '../../utils/tasks/repository'

export async function handleDeleteStudyTask(event: H3Event, rawParams: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const id = parseTaskId(rawParams)
  await deleteStudyTask(supabase, principal.userId, id)

  return { status: 'deleted' as const, id }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, () =>
    handleDeleteStudyTask(event, { id: getRouterParam(event, 'id') })
  )
})
