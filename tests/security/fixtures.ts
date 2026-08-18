import type { H3Event } from 'h3'

interface TestEventContext {
  auth?: {
    userId?: string
  }
}

export function createTestEvent(userId?: string): H3Event {
  const context: TestEventContext = {}

  if (userId) {
    context.auth = { userId }
  }

  return {
    context
  } as unknown as H3Event
}
