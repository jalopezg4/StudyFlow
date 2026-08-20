import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/tasks/repository', () => ({
  listStudyTasksForOwner: vi.fn()
}))

const { listStudyTasksForOwner } = await import('../../server/utils/tasks/repository')
const { handleListStudyTasks } = await import('../../server/api/tasks/index.get')

const mockedListStudyTasksForOwner = vi.mocked(listStudyTasksForOwner)

describe('GET /api/tasks - only-own-tasks listing (US1)', () => {
  beforeEach(() => {
    mockedListStudyTasksForOwner.mockReset()
  })

  it('returns exclusively the requesting principal\'s tasks', async () => {
    mockedListStudyTasksForOwner.mockResolvedValue([
      {
        id: 'task-a1',
        subjectId: 'subject-a1',
        subjectName: 'Calculus I',
        title: 'Read chapter 3',
        description: null,
        dueDate: null,
        status: 'pending',
        createdAt: '2026-08-19T00:00:00.000Z'
      }
    ])

    const event = createTestEvent('user-a')
    const result = await handleListStudyTasks(event)

    expect(result).toEqual({
      status: 'ok',
      tasks: [
        {
          id: 'task-a1',
          subjectId: 'subject-a1',
          subjectName: 'Calculus I',
          title: 'Read chapter 3',
          description: null,
          dueDate: null,
          status: 'pending',
          createdAt: '2026-08-19T00:00:00.000Z'
        }
      ]
    })
    expect(mockedListStudyTasksForOwner).toHaveBeenCalledWith(testSupabaseClient, 'user-a')
  })

  it('never returns a different principal\'s tasks, verified across two distinct requests', async () => {
    mockedListStudyTasksForOwner.mockImplementation(async (_supabase, userId) => [
      {
        id: `task-${userId}`,
        subjectId: 'subject-1',
        title: `Task for ${userId}`,
        description: null,
        dueDate: null,
        status: 'pending',
        createdAt: '2026-08-19T00:00:00.000Z'
      }
    ])

    const eventA = createTestEvent('user-a')
    const eventB = createTestEvent('user-b')

    const [resultA, resultB] = await Promise.all([
      handleListStudyTasks(eventA),
      handleListStudyTasks(eventB)
    ])

    expect(resultA.tasks).toEqual([
      {
        id: 'task-user-a',
        subjectId: 'subject-1',
        title: 'Task for user-a',
        description: null,
        dueDate: null,
        status: 'pending',
        createdAt: '2026-08-19T00:00:00.000Z'
      }
    ])
    expect(resultB.tasks).toEqual([
      {
        id: 'task-user-b',
        subjectId: 'subject-1',
        title: 'Task for user-b',
        description: null,
        dueDate: null,
        status: 'pending',
        createdAt: '2026-08-19T00:00:00.000Z'
      }
    ])
  })

  it('returns an empty array when the principal has no tasks', async () => {
    mockedListStudyTasksForOwner.mockResolvedValue([])

    const event = createTestEvent('user-a')
    const result = await handleListStudyTasks(event)

    expect(result).toEqual({ status: 'ok', tasks: [] })
  })
})

describe('GET /api/tasks - unauthenticated rejection (FR-009)', () => {
  beforeEach(() => {
    mockedListStudyTasksForOwner.mockReset()
  })

  it('rejects a request with no authenticated principal before reading any data', async () => {
    const event = createTestEvent()

    await expect(handleListStudyTasks(event)).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHENTICATED' }
    })
    expect(mockedListStudyTasksForOwner).not.toHaveBeenCalled()
  })
})
