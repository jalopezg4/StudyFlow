import { describe, expect, it } from 'vitest'
import { CreateSubjectSchema, UpdateSubjectSchema } from '../../server/utils/subjects/schemas'

describe('CreateSubjectSchema', () => {
  it('accepts a valid name with no description', () => {
    const result = CreateSubjectSchema.safeParse({ name: 'Calculus I' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: 'Calculus I' })
    }
  })

  it('accepts a valid name and description', () => {
    const result = CreateSubjectSchema.safeParse({
      name: 'Calculus I',
      description: 'Limits, derivatives, integrals'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('Limits, derivatives, integrals')
    }
  })

  it('trims the name before validating length', () => {
    const result = CreateSubjectSchema.safeParse({ name: '  Calculus I  ' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Calculus I')
    }
  })

  it('treats an empty description as no description', () => {
    const result = CreateSubjectSchema.safeParse({ name: 'Calculus I', description: '' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeUndefined()
    }
  })

  it('treats a whitespace-only description as no description', () => {
    const result = CreateSubjectSchema.safeParse({ name: 'Calculus I', description: '   ' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeUndefined()
    }
  })

  it('rejects a missing name', () => {
    const result = CreateSubjectSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('rejects an empty name', () => {
    const result = CreateSubjectSchema.safeParse({ name: '' })

    expect(result.success).toBe(false)
  })

  it('rejects a whitespace-only name', () => {
    const result = CreateSubjectSchema.safeParse({ name: '   ' })

    expect(result.success).toBe(false)
  })

  it('accepts a name at exactly the 100 character limit', () => {
    const result = CreateSubjectSchema.safeParse({ name: 'a'.repeat(100) })

    expect(result.success).toBe(true)
  })

  it('rejects a name over the 100 character limit', () => {
    const result = CreateSubjectSchema.safeParse({ name: 'a'.repeat(101) })

    expect(result.success).toBe(false)
  })

  it('accepts a description at exactly the 500 character limit', () => {
    const result = CreateSubjectSchema.safeParse({
      name: 'Calculus I',
      description: 'a'.repeat(500)
    })

    expect(result.success).toBe(true)
  })

  it('rejects a description over the 500 character limit', () => {
    const result = CreateSubjectSchema.safeParse({
      name: 'Calculus I',
      description: 'a'.repeat(501)
    })

    expect(result.success).toBe(false)
  })

  it('does not accept a client-supplied owner field as part of the schema', () => {
    const result = CreateSubjectSchema.safeParse({
      name: 'Calculus I',
      userId: 'attacker-controlled'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('userId')
    }
  })
})

describe('UpdateSubjectSchema', () => {
  it('accepts a name-only update', () => {
    const result = UpdateSubjectSchema.safeParse({ name: 'Calculus I - retake' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: 'Calculus I - retake' })
    }
  })

  it('accepts a description-only update', () => {
    const result = UpdateSubjectSchema.safeParse({ description: 'Updated note' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('Updated note')
      expect(result.data.name).toBeUndefined()
    }
  })

  it('accepts an update with both fields', () => {
    const result = UpdateSubjectSchema.safeParse({ name: 'Calculus I', description: 'Updated note' })

    expect(result.success).toBe(true)
  })

  it('rejects an update with neither field present', () => {
    const result = UpdateSubjectSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('rejects an empty name', () => {
    const result = UpdateSubjectSchema.safeParse({ name: '' })

    expect(result.success).toBe(false)
  })

  it('rejects a whitespace-only name', () => {
    const result = UpdateSubjectSchema.safeParse({ name: '   ' })

    expect(result.success).toBe(false)
  })

  it('rejects a name over the 100 character limit', () => {
    const result = UpdateSubjectSchema.safeParse({ name: 'a'.repeat(101) })

    expect(result.success).toBe(false)
  })

  it('rejects a description over the 500 character limit', () => {
    const result = UpdateSubjectSchema.safeParse({ description: 'a'.repeat(501) })

    expect(result.success).toBe(false)
  })

  it('trims the name before validating length', () => {
    const result = UpdateSubjectSchema.safeParse({ name: '  Calculus I  ' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Calculus I')
    }
  })
})
