import { describe, expect, it } from 'vitest'
import { CreateStudySessionSchema } from '../../server/utils/study-sessions/schemas'

const subjectId = '11111111-1111-1111-1111-111111111111'
const taskId = '22222222-2222-2222-2222-222222222222'

const validInput = {
  subjectId,
  durationMinutes: 45
}

describe('CreateStudySessionSchema', () => {
  it('accepts a subject-only session', () => {
    expect(CreateStudySessionSchema.parse(validInput)).toEqual(validInput)
  })

  it('accepts an optional task association', () => {
    expect(CreateStudySessionSchema.parse({ ...validInput, taskId })).toEqual({ ...validInput, taskId })
  })

  it.each([
    ['missing duration', undefined],
    ['zero duration', { durationMinutes: 0 }],
    ['negative duration', { durationMinutes: -1 }],
    ['decimal duration', { durationMinutes: 1.5 }],
    ['string duration', { durationMinutes: '45' }],
    ['over-limit duration', { durationMinutes: 1441 }]
  ])('rejects %s', (_caseName, duration) => {
    const input = duration === undefined ? { subjectId } : { ...validInput, ...duration }
    expect(CreateStudySessionSchema.safeParse(input).success).toBe(false)
  })

  it('rejects a missing or malformed subject id', () => {
    expect(CreateStudySessionSchema.safeParse({ durationMinutes: 45 }).success).toBe(false)
    expect(CreateStudySessionSchema.safeParse({ subjectId: 'not-a-uuid', durationMinutes: 45 }).success).toBe(false)
  })

  it('rejects a malformed task id', () => {
    expect(CreateStudySessionSchema.safeParse({ ...validInput, taskId: 'not-a-uuid' }).success).toBe(false)
  })
})
