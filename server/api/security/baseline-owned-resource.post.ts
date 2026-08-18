import { defineEventHandler, getQuery, readBody } from 'h3'
import { requireAuthenticatedPrincipal } from '../../utils/security/auth'
import { assertResourceOwnership } from '../../utils/security/authorization'
import { ownedResourceBodySchema, ownedResourceQuerySchema } from '../../utils/security/schemas'
import { validateWithSchema } from '../../utils/security/validation'
import { executeProtectedHandler } from './_shared'

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, async () => {
    const principal = requireAuthenticatedPrincipal(event)
    const query = validateWithSchema(ownedResourceQuerySchema, getQuery(event), 'query')
    const body = validateWithSchema(ownedResourceBodySchema, await readBody(event), 'body')

    assertResourceOwnership(principal, { ownerId: query.ownerId })
    assertResourceOwnership(principal, { ownerId: body.ownerId })

    return {
      status: 'accepted',
      ownerId: principal.userId,
      title: body.title
    }
  })
})
