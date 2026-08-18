import { defineEventHandler, getQuery } from 'h3'
import { requireAuthenticatedPrincipal } from '../../utils/security/auth'
import { assertResourceOwnership } from '../../utils/security/authorization'
import { executeProtectedHandler } from './_shared'

interface OwnershipQuery {
  ownerId: string
}

function hasOwnerId(value: unknown): value is OwnershipQuery {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ownerId' in value &&
    typeof value.ownerId === 'string' &&
    value.ownerId.trim().length > 0
  )
}

export default defineEventHandler((event) => {
  return executeProtectedHandler(event, async () => {
    const principal = requireAuthenticatedPrincipal(event)
    const query = getQuery(event)

    if (!hasOwnerId(query)) {
      throw new Error('ownerId query parameter must be validated with Zod in feature routes')
    }

    assertResourceOwnership(principal, { ownerId: query.ownerId })

    return {
      status: 'ok',
      ownerId: principal.userId
    }
  })
})
