import { describe, expect, it } from 'vitest'
import { createSafeHttpError, toSafeErrorResponse } from '../../server/utils/security/errors'

describe('security baseline error safety', () => {
  it('returns safe generic response for unknown errors', () => {
    const response = toSafeErrorResponse(new Error('database password leaked'))

    expect(response.statusCode).toBe(500)
    expect(response.error.code).toBe('INTERNAL_ERROR')
    expect(response.error.message).toBe('Internal server error')
    expect(response.error.message.includes('password')).toBe(false)
  })

  it('preserves safe status for known secure errors', () => {
    const safeError = createSafeHttpError(401, 'UNAUTHENTICATED', 'Authentication required')
    const response = toSafeErrorResponse(safeError)

    expect(response.statusCode).toBe(401)
    expect(response.error.code).toBe('UNAUTHENTICATED')
    expect(response.error.message).toBe('Authentication required')
  })
})
