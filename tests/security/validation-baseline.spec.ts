import { describe, expect, it } from 'vitest'
import {
  ownedResourceBodySchema,
  ownedResourceParamsSchema,
  ownedResourceQuerySchema
} from '../../server/utils/security/schemas'
import { validateWithSchema } from '../../server/utils/security/validation'

function expectValidationError(fn: () => void) {
  try {
    fn()
  } catch (error) {
    const err = error as { statusCode?: number; data?: { code?: string } }
    expect(err.statusCode).toBe(422)
    expect(err.data?.code).toBe('VALIDATION_ERROR')
    return
  }

  throw new Error('Expected function to throw')
}

describe('security baseline validation', () => {
  it('rejects invalid body payloads', () => {
    expectValidationError(() =>
      validateWithSchema(
        ownedResourceBodySchema,
        {
          ownerId: '',
          title: ''
        },
        'body'
      )
    )
  })

  it('rejects invalid query payloads', () => {
    expectValidationError(() =>
      validateWithSchema(
        ownedResourceQuerySchema,
        {
          ownerId: ''
        },
        'query'
      )
    )
  })

  it('rejects invalid params payloads', () => {
    expectValidationError(() =>
      validateWithSchema(
        ownedResourceParamsSchema,
        {
          resourceId: ''
        },
        'params'
      )
    )
  })
})
