import type { H3EventContext } from 'h3'

interface SupabaseAuthUser {
  id: string
}

export function resolveAuthContext(
  user: SupabaseAuthUser | null | undefined
): H3EventContext['auth'] {
  if (!user) {
    return undefined
  }

  return { userId: user.id }
}
