import type { H3Event } from 'h3'

export const testSupabaseClient = { __test__: 'supabase-client' }

interface TestEventContext {
  auth?: {
    userId?: string
  }
  supabase?: typeof testSupabaseClient
}

export function createTestEvent(userId?: string): H3Event {
  const context: TestEventContext = {
    supabase: testSupabaseClient
  }

  if (userId) {
    context.auth = { userId }
  }

  return {
    context
  } as unknown as H3Event
}
