import { defineEventHandler, type H3Event } from 'h3'
import { requireAuthenticatedPrincipal } from '../../utils/security/auth'
import { executeProtectedHandler } from '../security/_shared'
import { listSubjectsForOwner } from '../../utils/subjects/repository'

export async function handleListSubjects(event: H3Event) {
  const principal = requireAuthenticatedPrincipal(event)
  const subjects = await listSubjectsForOwner(principal.userId)

  return { status: 'ok' as const, subjects }
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, () => handleListSubjects(event))
})
