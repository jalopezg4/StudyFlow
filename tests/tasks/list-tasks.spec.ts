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
    expect(mockedListStudyTasksForOwner).toHaveBeenCalledWith(testSupabaseClient, 'user-a', undefined, undefined)
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

describe('GET /api/tasks - filter query translation (US1)', () => {
  beforeEach(() => {
    mockedListStudyTasksForOwner.mockReset()
    mockedListStudyTasksForOwner.mockResolvedValue([])
  })

  it('translates ?status=pending into a status filter', async () => {
    const event = createTestEvent('user-a', { status: 'pending' })

    await handleListStudyTasks(event)

    expect(mockedListStudyTasksForOwner).toHaveBeenCalledWith(
      testSupabaseClient,
      'user-a',
      { status: 'pending', subjectId: undefined },
      undefined
    )
  })

  it('translates ?subjectId=... into a subjectId filter', async () => {
    const event = createTestEvent('user-a', { subjectId: '11111111-1111-1111-1111-111111111111' })

    await handleListStudyTasks(event)

    expect(mockedListStudyTasksForOwner).toHaveBeenCalledWith(
      testSupabaseClient,
      'user-a',
      { status: undefined, subjectId: '11111111-1111-1111-1111-111111111111' },
      undefined
    )
  })

  it('translates ?status=...&subjectId=... into both filters together', async () => {
    const event = createTestEvent('user-a', {
      status: 'completed',
      subjectId: '11111111-1111-1111-1111-111111111111'
    })

    await handleListStudyTasks(event)

    expect(mockedListStudyTasksForOwner).toHaveBeenCalledWith(
      testSupabaseClient,
      'user-a',
      { status: 'completed', subjectId: '11111111-1111-1111-1111-111111111111' },
      undefined
    )
  })
})

describe('GET /api/tasks - sort query translation (US2)', () => {
  beforeEach(() => {
    mockedListStudyTasksForOwner.mockReset()
    mockedListStudyTasksForOwner.mockResolvedValue([])
  })

  it('translates ?sortBy=dueDate&sortDir=asc into a sort argument', async () => {
    const event = createTestEvent('user-a', { sortBy: 'dueDate', sortDir: 'asc' })

    await handleListStudyTasks(event)

    expect(mockedListStudyTasksForOwner).toHaveBeenCalledWith(testSupabaseClient, 'user-a', undefined, {
      by: 'dueDate',
      direction: 'asc'
    })
  })

  it('translates ?sortBy=title alone, leaving direction undefined for the repository default', async () => {
    const event = createTestEvent('user-a', { sortBy: 'title' })

    await handleListStudyTasks(event)

    expect(mockedListStudyTasksForOwner).toHaveBeenCalledWith(testSupabaseClient, 'user-a', undefined, {
      by: 'title',
      direction: undefined
    })
  })

  it('passes no sort argument at all when no sort params are supplied, reproducing the HU06 default (FR-011)', async () => {
    const event = createTestEvent('user-a')

    await handleListStudyTasks(event)

    expect(mockedListStudyTasksForOwner).toHaveBeenCalledWith(testSupabaseClient, 'user-a', undefined, undefined)
  })
})

describe('GET /api/tasks - reject unsupported/malformed values (US3)', () => {
  beforeEach(() => {
    mockedListStudyTasksForOwner.mockReset()
  })

  it.each([
    ['unsupported status', { status: 'archived' }],
    ['case-variant status', { status: 'Pending' }],
    ['unsupported sortBy', { sortBy: 'priority' }],
    ['unsupported sortDir', { sortBy: 'dueDate', sortDir: 'ascending' }],
    ['malformed subjectId', { subjectId: 'not-a-uuid' }],
    ['sortDir without sortBy', { sortDir: 'asc' }],
    ['repeated status parameter', { status: ['pending', 'completed'] }]
  ])('rejects %s with a validation error and no task data', async (_label, query) => {
    const event = createTestEvent('user-a', query as Record<string, string | string[]>)

    await expect(handleListStudyTasks(event)).rejects.toMatchObject({
      statusCode: 422,
      data: { code: 'VALIDATION_ERROR' }
    })
    expect(mockedListStudyTasksForOwner).not.toHaveBeenCalled()
  })

  it('rejects an unauthenticated request carrying filter/sort parameters before validation runs', async () => {
    const event = createTestEvent(undefined, { status: 'pending' })

    await expect(handleListStudyTasks(event)).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHENTICATED' }
    })
    expect(mockedListStudyTasksForOwner).not.toHaveBeenCalled()
  })
})

describe('GET /api/tasks - combine filter and sort (US4)', () => {
  beforeEach(() => {
    mockedListStudyTasksForOwner.mockReset()
    mockedListStudyTasksForOwner.mockResolvedValue([])
  })

  it('passes both a filter and a sort argument for a request combining status, sortBy, and sortDir', async () => {
    const event = createTestEvent('user-a', { status: 'pending', sortBy: 'dueDate', sortDir: 'asc' })

    await handleListStudyTasks(event)

    expect(mockedListStudyTasksForOwner).toHaveBeenCalledWith(
      testSupabaseClient,
      'user-a',
      { status: 'pending', subjectId: undefined },
      { by: 'dueDate', direction: 'asc' }
    )
  })

  it('rejects the entire request when a valid filter is paired with an unsupported sort value, applying nothing', async () => {
    const event = createTestEvent('user-a', { status: 'pending', sortBy: 'not-a-real-field' })

    await expect(handleListStudyTasks(event)).rejects.toMatchObject({
      statusCode: 422,
      data: { code: 'VALIDATION_ERROR' }
    })
    expect(mockedListStudyTasksForOwner).not.toHaveBeenCalled()
  })

  it('rejects the entire request when an unsupported filter is paired with a valid sort value, applying nothing', async () => {
    const event = createTestEvent('user-a', { status: 'archived', sortBy: 'dueDate' })

    await expect(handleListStudyTasks(event)).rejects.toMatchObject({
      statusCode: 422,
      data: { code: 'VALIDATION_ERROR' }
    })
    expect(mockedListStudyTasksForOwner).not.toHaveBeenCalled()
  })
})
