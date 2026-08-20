import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
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

/**
 * Returns the session-scoped Supabase client resolved by server/middleware/auth.ts
 * for the current request (built from the caller's own cookies/access token).
 * Using this instead of a service-role client means RLS policies are actually
 * enforced as a defense-in-depth backstop, not just application-layer checks.
 */
export function requireRequestSupabaseClient(event: H3Event): SupabaseClient {
  const client = event.context.supabase

  if (!client) {
    throw createSafeHttpError(500, 'INTERNAL_ERROR', 'Request Supabase client is not available')
  }

  return client
}
