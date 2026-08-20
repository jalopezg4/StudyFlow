import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/tasks/repository', () => ({
  deleteStudyTask: vi.fn(),
  listStudyTasksForOwner: vi.fn()
}))

const { deleteStudyTask, listStudyTasksForOwner } = await import('../../server/utils/tasks/repository')
const { handleDeleteStudyTask } = await import('../../server/api/tasks/[id].delete')

const mockedDeleteStudyTask = vi.mocked(deleteStudyTask)
const mockedListStudyTasksForOwner = vi.mocked(listStudyTasksForOwner)

describe('DELETE /api/tasks/:id - delete an owned task (US4)', () => {
  beforeEach(() => {
    mockedDeleteStudyTask.mockReset()
    mockedListStudyTasksForOwner.mockReset()
  })

  it('deletes the task and it no longer appears in a subsequent listing', async () => {
    const fakeStore = [
      {
        id: 'task-1',
        subjectId: 'subject-1',
        title: 'Read chapter 3',
        description: null,
        dueDate: null,
        status: 'pending' as const,
        createdAt: '2026-08-19T00:00:00.000Z'
      }
    ]

    mockedDeleteStudyTask.mockImplementation(async (_supabase, _userId, id) => {
      const index = fakeStore.findIndex((task) => task.id === id)
      fakeStore.splice(index, 1)
    })
    mockedListStudyTasksForOwner.mockImplementation(async () => [...fakeStore])

    const event = createTestEvent('user-a')
    const result = await handleDeleteStudyTask(event, { id: 'task-1' })

    expect(result).toEqual({ status: 'deleted', id: 'task-1' })
    expect(mockedDeleteStudyTask).toHaveBeenCalledWith(testSupabaseClient, 'user-a', 'task-1')

    const listing = await listStudyTasksForOwner(testSupabaseClient, 'user-a')
    expect(listing).toEqual([])
  })
})

describe('DELETE /api/tasks/:id - nonexistent or already-deleted task (US4 AC2)', () => {
  beforeEach(() => {
    mockedDeleteStudyTask.mockReset()
  })

  it('returns 404 NOT_FOUND when no owned row matches the id, without erroring the flow', async () => {
    mockedDeleteStudyTask.mockRejectedValue(
      Object.assign(new Error('not found'), {
        statusCode: 404,
        statusMessage: 'Study task not found',
        data: { code: 'NOT_FOUND', message: 'Study task not found' }
      })
    )

    const event = createTestEvent('user-a')

    await expect(handleDeleteStudyTask(event, { id: 'nonexistent' })).rejects.toMatchObject({
      statusCode: 404,
      data: { code: 'NOT_FOUND' }
    })
  })
})

describe('DELETE /api/tasks/:id - unauthenticated rejection (FR-009)', () => {
  beforeEach(() => {
    mockedDeleteStudyTask.mockReset()
  })

  it('rejects a request with no authenticated principal before deleting anything', async () => {
    const event = createTestEvent()

    await expect(handleDeleteStudyTask(event, { id: 'task-1' })).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHENTICATED' }
    })
    expect(mockedDeleteStudyTask).not.toHaveBeenCalled()
  })
})
