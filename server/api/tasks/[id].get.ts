import { defineEventHandler, getRouterParam, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { createSafeHttpError } from '../../utils/security/errors'
import { executeProtectedHandler } from '../security/_shared'
import { parseTaskId } from '../../utils/tasks/schemas'
import { getStudyTaskForOwner } from '../../utils/tasks/repository'

export async function handleGetStudyTask(event: H3Event, rawParams: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const id = parseTaskId(rawParams)
  const task = await getStudyTaskForOwner(supabase, principal.userId, id)

  if (!task) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Study task not found')
  }

  return { status: 'ok' as const, task }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, () =>
    handleGetStudyTask(event, { id: getRouterParam(event, 'id') })
  )
})
