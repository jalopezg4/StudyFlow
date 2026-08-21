import { defineEventHandler, getQuery, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal, requireRequestSupabaseClient } from '../../utils/security/auth'
import { validateWithSchema } from '../../utils/security/validation'
import { executeProtectedHandler } from '../security/_shared'
import { listStudyTasksForOwner, type StudyTaskListFilter, type StudyTaskListSort } from '../../utils/tasks/repository'
import { TaskListQuerySchema } from '../../utils/tasks/schemas'

export async function handleListStudyTasks(event: H3Event) {
  const principal = requireAuthenticatedPrincipal(event)
  const supabase = requireRequestSupabaseClient(event)

  // Auth is resolved above before this validation runs, so an unauthenticated
  // request is rejected before any filter/sort parameter is even parsed (FR-010).
  const query = validateWithSchema(TaskListQuerySchema, getQuery(event), 'query')

  const filter: StudyTaskListFilter | undefined =
    query.status !== undefined || query.subjectId !== undefined
      ? { status: query.status, subjectId: query.subjectId }
      : undefined

  const sort: StudyTaskListSort | undefined =
    query.sortBy !== undefined ? { by: query.sortBy, direction: query.sortDir } : undefined

  const tasks = await listStudyTasksForOwner(supabase, principal.userId, filter, sort)

  return { status: 'ok' as const, tasks }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, () => handleListStudyTasks(event))
})
