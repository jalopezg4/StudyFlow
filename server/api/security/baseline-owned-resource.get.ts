import { defineEventHandler, getQuery } from 'h3'
import { requireAuthenticatedPrincipal } from '../../utils/security/auth'
import { assertResourceOwnership } from '../../utils/security/authorization'
import { ownedResourceQuerySchema } from '../../utils/security/schemas'
import { validateWithSchema } from '../../utils/security/validation'
import { executeProtectedHandler } from './_shared'

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, async () => {
    const principal = requireAuthenticatedPrincipal(event)
    const query = validateWithSchema(ownedResourceQuerySchema, getQuery(event), 'query')

    assertResourceOwnership(principal, { ownerId: query.ownerId })

    return {
      status: 'ok',
      ownerId: principal.userId,
      includeMeta: query.includeMeta ?? false
    }
  })
})
