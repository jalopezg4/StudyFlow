import { describe, expect, it } from 'vitest'
import { requireAuthenticatedPrincipal } from '../../server/utils/security/auth'
import { assertResourceOwnership } from '../../server/utils/security/authorization'
import { createTestEvent } from './fixtures'

function expectSecurityError(fn: () => void, statusCode: number, code: string) {
  try {
    fn()
  } catch (error) {
    const err = error as { statusCode?: number; data?: { code?: string } }
    expect(err.statusCode).toBe(statusCode)
    expect(err.data?.code).toBe(code)
    return
  }

  throw new Error('Expected function to throw')
}

describe('security baseline auth and authorization', () => {
  it('rejects unauthenticated protected access', () => {
    const event = createTestEvent()

    expectSecurityError(() => requireAuthenticatedPrincipal(event), 401, 'UNAUTHENTICATED')
  })

  it('rejects ownership mismatch', () => {
    const principal = { userId: 'user-a' }

    expectSecurityError(
      () =>
      assertResourceOwnership(principal, {
        ownerId: 'user-b'
      }),
      403,
      'FORBIDDEN'
    )
  })

  it('accepts ownership match', () => {
    const principal = { userId: 'user-a' }

    expect(() =>
      assertResourceOwnership(principal, {
        ownerId: 'user-a'
      })
    ).not.toThrow()
  })
})
