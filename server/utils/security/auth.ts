import type { H3Event } from 'h3'
import { createSafeHttpError } from './errors'
import type { AuthenticatedPrincipal } from './types'

interface AuthContext {
  userId?: string
}

interface SecurityEventContext {
  auth?: AuthContext
}

export function getAuthenticatedPrincipal(event: H3Event): AuthenticatedPrincipal | null {
  const context = event.context as SecurityEventContext
  const userId = context.auth?.userId

  if (!userId || userId.trim().length === 0) {
    return null
  }

  return { userId }
}

export function requireAuthenticatedPrincipal(event: H3Event): AuthenticatedPrincipal {
  const principal = getAuthenticatedPrincipal(event)

  if (!principal) {
    throw createSafeHttpError(401, 'UNAUTHENTICATED', 'Authentication required')
  }

  return principal
}
