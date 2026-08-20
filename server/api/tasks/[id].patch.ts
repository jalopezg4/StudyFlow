import { defineEventHandler, getRouterParam, readBody, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { validateWithSchema } from '../../utils/security/validation'
import { executeProtectedHandler } from '../security/_shared'
import { parseTaskId, UpdateStudyTaskSchema } from '../../utils/tasks/schemas'
import { updateStudyTask } from '../../utils/tasks/repository'

export async function handleUpdateStudyTask(event: H3Event, rawParams: unknown, rawBody: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)
  const id = parseTaskId(rawParams)
  const patch = validateWithSchema(UpdateStudyTaskSchema, rawBody, 'body')
  const task = await updateStudyTask(supabase, principal.userId, id, patch)

  return { status: 'updated' as const, task }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, async () =>
    handleUpdateStudyTask(event, { id: getRouterParam(event, 'id') }, await readBody(event))
  )
})
