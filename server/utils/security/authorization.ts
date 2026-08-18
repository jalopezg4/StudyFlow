import { createSafeHttpError } from './errors'
import type { AuthenticatedPrincipal, OwnedResourceReference } from './types'

export function assertResourceOwnership(
  principal: AuthenticatedPrincipal,
  resource: OwnedResourceReference
) {
  if (principal.userId !== resource.ownerId) {
    throw createSafeHttpError(403, 'FORBIDDEN', 'Insufficient permissions')
  }
}
