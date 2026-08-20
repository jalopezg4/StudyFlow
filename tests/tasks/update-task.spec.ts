import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/tasks/repository', () => ({
  updateStudyTask: vi.fn()
}))

const { updateStudyTask } = await import('../../server/utils/tasks/repository')
const { handleUpdateStudyTask } = await import('../../server/api/tasks/[id].patch')

const mockedUpdateStudyTask = vi.mocked(updateStudyTask)

function expectSecurityError(promise: Promise<unknown>, statusCode: number, code: string) {
  return expect(promise).rejects.toMatchObject({
    statusCode,
    data: { code }
  })
}

describe('PATCH /api/tasks/:id - valid partial updates (US2)', () => {
  beforeEach(() => {
    mockedUpdateStudyTask.mockReset()
  })

  it('updates the title only', async () => {
    mockedUpdateStudyTask.mockResolvedValue({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      subjectId: 'subject-1',
      title: 'Read chapters 3-4',
      description: null,
      dueDate: null,
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { title: 'Read chapters 3-4' })

    expect(result).toEqual({
      status: 'updated',
      task: {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        subjectId: 'subject-1',
        title: 'Read chapters 3-4',
        description: null,
        dueDate: null,
        status: 'pending',
        createdAt: '2026-08-19T00:00:00.000Z'
      }
    })
    expect(mockedUpdateStudyTask).toHaveBeenCalledWith(testSupabaseClient, 'user-a', 'cccccccc-cccc-cccc-cccc-cccccccccccc', { title: 'Read chapters 3-4' })
  })

  it('updates the description only', async () => {
    mockedUpdateStudyTask.mockResolvedValue({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      subjectId: 'subject-1',
      title: 'Read chapter 3',
      description: 'Updated note',
      dueDate: null,
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { description: 'Updated note' })

    expect(result.task.description).toBe('Updated note')
  })

  it('updates the due date only', async () => {
    mockedUpdateStudyTask.mockResolvedValue({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      subjectId: 'subject-1',
      title: 'Read chapter 3',
      description: null,
      dueDate: '2026-09-05',
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { dueDate: '2026-09-05' })

    expect(result.task.dueDate).toBe('2026-09-05')
  })

  it('marks a task as completed', async () => {
    mockedUpdateStudyTask.mockResolvedValue({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      subjectId: 'subject-1',
      title: 'Read chapter 3',
      description: null,
      dueDate: null,
      status: 'completed',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { status: 'completed' })

    expect(result.task.status).toBe('completed')
    expect(mockedUpdateStudyTask).toHaveBeenCalledWith(testSupabaseClient, 'user-a', 'cccccccc-cccc-cccc-cccc-cccccccccccc', { status: 'completed' })
  })

  it('marks a completed task back to pending', async () => {
    mockedUpdateStudyTask.mockResolvedValue({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      subjectId: 'subject-1',
      title: 'Read chapter 3',
      description: null,
      dueDate: null,
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { status: 'pending' })

    expect(result.task.status).toBe('pending')
  })

  it('updates multiple fields at once', async () => {
    mockedUpdateStudyTask.mockResolvedValue({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      subjectId: 'subject-1',
      title: 'Read chapters 3-4',
      description: 'Updated note',
      dueDate: '2026-09-05',
      status: 'completed',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    await handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, {
      title: 'Read chapters 3-4',
      description: 'Updated note',
      dueDate: '2026-09-05',
      status: 'completed'
    })

    expect(mockedUpdateStudyTask).toHaveBeenCalledWith(testSupabaseClient, 'user-a', 'cccccccc-cccc-cccc-cccc-cccccccccccc', {
      title: 'Read chapters 3-4',
      description: 'Updated note',
      dueDate: '2026-09-05',
      status: 'completed'
    })
  })

  it('clears an existing description and due date via an explicit empty string', async () => {
    mockedUpdateStudyTask.mockResolvedValue({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      subjectId: 'subject-1',
      title: 'Read chapter 3',
      description: null,
      dueDate: null,
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleUpdateStudyTask(
      event,
      { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
      { description: '', dueDate: '' }
    )

    expect(result.task.description).toBeNull()
    expect(result.task.dueDate).toBeNull()
    expect(mockedUpdateStudyTask).toHaveBeenCalledWith(testSupabaseClient, 'user-a', 'cccccccc-cccc-cccc-cccc-cccccccccccc', {
      description: null,
      dueDate: null
    })
  })
})

describe('PATCH /api/tasks/:id - invalid update rejection (US2)', () => {
  beforeEach(() => {
    mockedUpdateStudyTask.mockReset()
  })

  it('rejects a body with none of the four fields present, without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, {}),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateStudyTask).not.toHaveBeenCalled()
  })

  it('rejects an empty title without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { title: '' }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateStudyTask).not.toHaveBeenCalled()
  })

  it('rejects a title longer than 100 characters without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { title: 'a'.repeat(101) }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateStudyTask).not.toHaveBeenCalled()
  })

  it('rejects a description longer than 500 characters without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { description: 'a'.repeat(501) }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateStudyTask).not.toHaveBeenCalled()
  })

  it('rejects an invalid due date without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { dueDate: 'not-a-date' }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateStudyTask).not.toHaveBeenCalled()
  })

  it('rejects an invalid status value without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { status: 'archived' }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateStudyTask).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/tasks/:id - unauthenticated rejection (FR-009)', () => {
  beforeEach(() => {
    mockedUpdateStudyTask.mockReset()
  })

  it('rejects a request with no authenticated principal before changing any data', async () => {
    const event = createTestEvent()

    await expectSecurityError(
      handleUpdateStudyTask(event, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }, { title: 'Read chapter 3' }),
      401,
      'UNAUTHENTICATED'
    )
    expect(mockedUpdateStudyTask).not.toHaveBeenCalled()
  })
})
