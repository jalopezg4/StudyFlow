import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/subjects/repository', () => ({
  listSubjectsForOwner: vi.fn()
}))

const { listSubjectsForOwner } = await import('../../server/utils/subjects/repository')
const { handleListSubjects } = await import('../../server/api/subjects/index.get')

const mockedListSubjectsForOwner = vi.mocked(listSubjectsForOwner)

describe('GET /api/subjects - only-own-subjects listing (CA01)', () => {
  beforeEach(() => {
    mockedListSubjectsForOwner.mockReset()
  })

  it('returns exclusively the requesting principal\'s subjects', async () => {
    mockedListSubjectsForOwner.mockResolvedValue([
      { id: 'subject-a1', name: 'Calculus I', description: null, createdAt: '2026-08-18T00:00:00.000Z' }
    ])

    const event = createTestEvent('user-a')
    const result = await handleListSubjects(event)

    expect(result).toEqual({
      status: 'ok',
      subjects: [
        { id: 'subject-a1', name: 'Calculus I', description: null, createdAt: '2026-08-18T00:00:00.000Z' }
      ]
    })
    expect(mockedListSubjectsForOwner).toHaveBeenCalledWith(testSupabaseClient, 'user-a')
  })

  it('never returns a different principal\'s subjects, verified across two distinct requests', async () => {
    mockedListSubjectsForOwner.mockImplementation(async (_supabase, userId) => [
      { id: `subject-${userId}`, name: `Subject for ${userId}`, description: null, createdAt: '2026-08-18T00:00:00.000Z' }
    ])

    const eventA = createTestEvent('user-a')
    const eventB = createTestEvent('user-b')

    const [resultA, resultB] = await Promise.all([
      handleListSubjects(eventA),
      handleListSubjects(eventB)
    ])

    expect(resultA.subjects).toEqual([
      { id: 'subject-user-a', name: 'Subject for user-a', description: null, createdAt: '2026-08-18T00:00:00.000Z' }
    ])
    expect(resultB.subjects).toEqual([
      { id: 'subject-user-b', name: 'Subject for user-b', description: null, createdAt: '2026-08-18T00:00:00.000Z' }
    ])
  })

  it('returns an empty array when the principal has no subjects', async () => {
    mockedListSubjectsForOwner.mockResolvedValue([])

    const event = createTestEvent('user-a')
    const result = await handleListSubjects(event)

    expect(result).toEqual({ status: 'ok', subjects: [] })
  })
})

describe('GET /api/subjects - surfaces taskCount for delete-warning UX (HU06 amendment)', () => {
  beforeEach(() => {
    mockedListSubjectsForOwner.mockReset()
  })

  it('passes through the taskCount the repository reports for each subject', async () => {
    mockedListSubjectsForOwner.mockResolvedValue([
      { id: 'subject-a1', name: 'Calculus I', description: null, createdAt: '2026-08-18T00:00:00.000Z', taskCount: 3 },
      { id: 'subject-a2', name: 'History', description: null, createdAt: '2026-08-18T00:00:00.000Z', taskCount: 0 }
    ])

    const event = createTestEvent('user-a')
    const result = await handleListSubjects(event)

    expect(result.subjects[0].taskCount).toBe(3)
    expect(result.subjects[1].taskCount).toBe(0)
  })
})

describe('GET /api/subjects - unauthenticated rejection (FR-008)', () => {
  beforeEach(() => {
    mockedListSubjectsForOwner.mockReset()
  })

  it('rejects a request with no authenticated principal before reading any data', async () => {
    const event = createTestEvent()

    await expect(handleListSubjects(event)).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHENTICATED' }
    })
    expect(mockedListSubjectsForOwner).not.toHaveBeenCalled()
  })
})
