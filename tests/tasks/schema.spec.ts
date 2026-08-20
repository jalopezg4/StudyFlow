import { describe, expect, it } from 'vitest'
import { CreateStudyTaskSchema } from '../../server/utils/tasks/schemas'

describe('CreateStudyTaskSchema', () => {
  it('accepts a valid subjectId and title with no other fields', () => {
    const result = CreateStudyTaskSchema.safeParse({ subjectId: '11111111-1111-1111-1111-111111111111', title: 'Read chapter 3' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ subjectId: '11111111-1111-1111-1111-111111111111', title: 'Read chapter 3' })
    }
  })

  it('accepts a valid title, description, and due date', () => {
    const result = CreateStudyTaskSchema.safeParse({
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      description: 'Focus on section 3.2',
      dueDate: '2026-09-01'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('Focus on section 3.2')
      expect(result.data.dueDate).toBe('2026-09-01')
    }
  })

  it('trims the title before validating length', () => {
    const result = CreateStudyTaskSchema.safeParse({ subjectId: '11111111-1111-1111-1111-111111111111', title: '  Read chapter 3  ' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Read chapter 3')
    }
  })

  it('treats an empty description as no description', () => {
    const result = CreateStudyTaskSchema.safeParse({
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      description: ''
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeUndefined()
    }
  })

  it('treats a whitespace-only description as no description', () => {
    const result = CreateStudyTaskSchema.safeParse({
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      description: '   '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeUndefined()
    }
  })

  it('treats an empty due date as no due date, not a validation failure', () => {
    const result = CreateStudyTaskSchema.safeParse({
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      dueDate: ''
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dueDate).toBeUndefined()
    }
  })

  it('rejects a due date that is not a valid date', () => {
    const result = CreateStudyTaskSchema.safeParse({
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      dueDate: 'not-a-date'
    })

    expect(result.success).toBe(false)
  })

  it('accepts a due date far in the past with no restriction', () => {
    const result = CreateStudyTaskSchema.safeParse({
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Catch-up work',
      dueDate: '2000-01-01'
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing title', () => {
    const result = CreateStudyTaskSchema.safeParse({ subjectId: '11111111-1111-1111-1111-111111111111' })

    expect(result.success).toBe(false)
  })

  it('rejects an empty title', () => {
    const result = CreateStudyTaskSchema.safeParse({ subjectId: '11111111-1111-1111-1111-111111111111', title: '' })

    expect(result.success).toBe(false)
  })

  it('rejects a whitespace-only title', () => {
    const result = CreateStudyTaskSchema.safeParse({ subjectId: '11111111-1111-1111-1111-111111111111', title: '   ' })

    expect(result.success).toBe(false)
  })

  it('rejects a missing subjectId', () => {
    const result = CreateStudyTaskSchema.safeParse({ title: 'Read chapter 3' })

    expect(result.success).toBe(false)
  })

  it('rejects a subjectId that is not a valid UUID', () => {
    const result = CreateStudyTaskSchema.safeParse({ subjectId: 'abc', title: 'Read chapter 3' })

    expect(result.success).toBe(false)
  })

  it('rejects a due date in an ambiguous non-ISO format (e.g. MM/DD/YYYY)', () => {
    const result = CreateStudyTaskSchema.safeParse({
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      dueDate: '09/01/2026'
    })

    expect(result.success).toBe(false)
  })

  it('accepts a title at exactly the 100 character limit', () => {
    const result = CreateStudyTaskSchema.safeParse({ subjectId: '11111111-1111-1111-1111-111111111111', title: 'a'.repeat(100) })

    expect(result.success).toBe(true)
  })

  it('rejects a title over the 100 character limit', () => {
    const result = CreateStudyTaskSchema.safeParse({ subjectId: '11111111-1111-1111-1111-111111111111', title: 'a'.repeat(101) })

    expect(result.success).toBe(false)
  })

  it('accepts a description at exactly the 500 character limit', () => {
    const result = CreateStudyTaskSchema.safeParse({
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      description: 'a'.repeat(500)
    })

    expect(result.success).toBe(true)
  })

  it('rejects a description over the 500 character limit', () => {
    const result = CreateStudyTaskSchema.safeParse({
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      description: 'a'.repeat(501)
    })

    expect(result.success).toBe(false)
  })

  it('does not accept a client-supplied owner or status field as part of the schema', () => {
    const result = CreateStudyTaskSchema.safeParse({
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      userId: 'attacker-controlled',
      status: 'completed'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('userId')
      expect(result.data).not.toHaveProperty('status')
    }
  })
})
