import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/tasks/repository', () => ({
  getRecommendedTaskForOwner: vi.fn()
}))

const { getRecommendedTaskForOwner } = await import('../../server/utils/tasks/repository')
const { handleGetRecommendation } = await import('../../server/api/tasks/recommendation.get')

const mockedGetRecommendedTaskForOwner = vi.mocked(getRecommendedTaskForOwner)

describe('GET /api/tasks/recommendation - success path (US1)', () => {
  beforeEach(() => {
    mockedGetRecommendedTaskForOwner.mockReset()
  })

  it('returns 200 with the recommended task in the response body', async () => {
    mockedGetRecommendedTaskForOwner.mockResolvedValue({
      id: 'task-a1',
      subjectId: 'subject-a1',
      subjectName: 'Calculus I',
      title: 'Read chapter 3',
      description: null,
      dueDate: '2026-09-01',
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleGetRecommendation(event)

    expect(result).toEqual({
      status: 'ok',
      task: {
        id: 'task-a1',
        subjectId: 'subject-a1',
        subjectName: 'Calculus I',
        title: 'Read chapter 3',
        description: null,
        dueDate: '2026-09-01',
        status: 'pending',
        createdAt: '2026-08-19T00:00:00.000Z'
      }
    })
    expect(mockedGetRecommendedTaskForOwner).toHaveBeenCalledWith(testSupabaseClient, 'user-a')
  })
})

describe('GET /api/tasks/recommendation - empty state (US2)', () => {
  beforeEach(() => {
    mockedGetRecommendedTaskForOwner.mockReset()
  })

  it('returns 200 with a null task, not an error, when nothing is eligible', async () => {
    mockedGetRecommendedTaskForOwner.mockResolvedValue(null)

    const event = createTestEvent('user-a')
    const result = await handleGetRecommendation(event)

    expect(result).toEqual({ status: 'ok', task: null })
  })
})

describe('GET /api/tasks/recommendation - unauthenticated rejection (US3, FR-006)', () => {
  beforeEach(() => {
    mockedGetRecommendedTaskForOwner.mockReset()
  })

  it('rejects a request with no authenticated principal before evaluating any task', async () => {
    const event = createTestEvent()

    await expect(handleGetRecommendation(event)).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHENTICATED' }
    })
    expect(mockedGetRecommendedTaskForOwner).not.toHaveBeenCalled()
  })
})
