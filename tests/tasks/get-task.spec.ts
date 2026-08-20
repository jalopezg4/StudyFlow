import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/tasks/repository', () => ({
  getStudyTaskForOwner: vi.fn()
}))

const { getStudyTaskForOwner } = await import('../../server/utils/tasks/repository')
const { handleGetStudyTask } = await import('../../server/api/tasks/[id].get')

const mockedGetStudyTaskForOwner = vi.mocked(getStudyTaskForOwner)

describe('GET /api/tasks/:id - retrieve an owned task (US3 AC1, positive path)', () => {
  beforeEach(() => {
    mockedGetStudyTaskForOwner.mockReset()
  })

  it('returns the task when it belongs to the requesting principal', async () => {
    mockedGetStudyTaskForOwner.mockResolvedValue({
      id: 'task-1',
      subjectId: 'subject-1',
      title: 'Read chapter 3',
      description: 'Focus on section 3.2',
      dueDate: '2026-09-01',
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleGetStudyTask(event, { id: 'task-1' })

    expect(result).toEqual({
      status: 'ok',
      task: {
        id: 'task-1',
        subjectId: 'subject-1',
        title: 'Read chapter 3',
        description: 'Focus on section 3.2',
        dueDate: '2026-09-01',
        status: 'pending',
        createdAt: '2026-08-19T00:00:00.000Z'
      }
    })
    expect(mockedGetStudyTaskForOwner).toHaveBeenCalledWith(testSupabaseClient, 'user-a', 'task-1')
  })
})

describe('GET /api/tasks/:id - unauthenticated rejection (FR-009)', () => {
  beforeEach(() => {
    mockedGetStudyTaskForOwner.mockReset()
  })

  it('rejects a request with no authenticated principal before reading any data', async () => {
    const event = createTestEvent()

    await expect(handleGetStudyTask(event, { id: 'task-1' })).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHENTICATED' }
    })
    expect(mockedGetStudyTaskForOwner).not.toHaveBeenCalled()
  })
})

// Cross-owner and nonexistent-id denial cases for this endpoint live in
// tests/tasks/ownership.spec.ts (User Story 3), not here.
