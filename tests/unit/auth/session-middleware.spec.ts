import { describe, expect, it } from 'vitest'
import { resolveAuthContext } from '../../../server/utils/security/session'

describe('resolveAuthContext', () => {
  it('sets auth context with userId when a Supabase user is present', () => {
    expect(resolveAuthContext({ id: 'user-123' })).toEqual({ userId: 'user-123' })
  })

  it('leaves auth context unset when there is no Supabase user (missing/invalid session)', () => {
    expect(resolveAuthContext(null)).toBeUndefined()
    expect(resolveAuthContext(undefined)).toBeUndefined()
  })
})
