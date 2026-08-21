import type { H3Event } from 'h3'

export const testSupabaseClient = { __test__: 'supabase-client' }

interface TestEventContext {
  auth?: {
    userId?: string
  }
  supabase?: typeof testSupabaseClient
}

export function createTestEvent(
  userId?: string,
  query?: Record<string, string | string[]>
): H3Event {
  const context: TestEventContext = {
    supabase: testSupabaseClient
  }

  if (userId) {
    context.auth = { userId }
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    for (const entry of Array.isArray(value) ? value : [value]) {
      params.append(key, entry)
    }
  }
  const search = params.toString()

  return {
    context,
    // h3's getQuery(event) reads event.path, not a real Node request.
    path: search ? `/?${search}` : '/'
  } as unknown as H3Event
}
