import { describe, expect, it } from 'vitest'
import { LoginRequestSchema, RegisterRequestSchema } from '../../../shared/utils/auth-schemas'

describe('RegisterRequestSchema', () => {
  it('accepts a valid email and an 8+ character password', () => {
    const result = RegisterRequestSchema.safeParse({
      email: 'student@example.com',
      password: 'password123'
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid email format', () => {
    const result = RegisterRequestSchema.safeParse({
      email: 'not-an-email',
      password: 'password123'
    })

    expect(result.success).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = RegisterRequestSchema.safeParse({
      email: 'student@example.com',
      password: 'short1'
    })

    expect(result.success).toBe(false)
  })
})

describe('LoginRequestSchema', () => {
  it('accepts a valid email and a non-empty password', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'student@example.com',
      password: 'anything'
    })

    expect(result.success).toBe(true)
  })

  it('rejects an empty password', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'student@example.com',
      password: ''
    })

    expect(result.success).toBe(false)
  })

  it('rejects an invalid email format', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'not-an-email',
      password: 'anything'
    })

    expect(result.success).toBe(false)
  })
})
