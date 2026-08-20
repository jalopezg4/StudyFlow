import { defineEventHandler, readBody, setResponseStatus, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal } from '../../utils/security/auth'
import { validateWithSchema } from '../../utils/security/validation'
import { createSafeHttpError } from '../../utils/security/errors'
import { executeProtectedHandler } from '../security/_shared'
import { CreateStudyTaskSchema } from '../../utils/tasks/schemas'
import { createStudyTask } from '../../utils/tasks/repository'
import { getSubjectForOwner } from '../../utils/subjects/repository'

export async function handleCreateStudyTask(event: H3Event, rawBody: unknown) {
  const principal = requireAuthenticatedPrincipal(event)
  const body = validateWithSchema(CreateStudyTaskSchema, rawBody, 'body')

  const subject = await getSubjectForOwner(principal.userId, body.subjectId)
  if (!subject) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Subject not found')
  }

  const task = await createStudyTask(principal.userId, body)

  return { status: 'created' as const, task }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, async () => {
    const result = await handleCreateStudyTask(event, await readBody(event))
    setResponseStatus(event, 201)
    return result
  })
})
