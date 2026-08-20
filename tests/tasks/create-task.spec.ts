import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/tasks/repository', () => ({
  createStudyTask: vi.fn()
}))

vi.mock('../../server/utils/subjects/repository', () => ({
  getSubjectForOwner: vi.fn()
}))

const { createStudyTask } = await import('../../server/utils/tasks/repository')
const { getSubjectForOwner } = await import('../../server/utils/subjects/repository')
const { handleCreateStudyTask } = await import('../../server/api/tasks/index.post')

const mockedCreateStudyTask = vi.mocked(createStudyTask)
const mockedGetSubjectForOwner = vi.mocked(getSubjectForOwner)

const ownedSubject = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Calculus I',
  description: null,
  createdAt: '2026-08-18T00:00:00.000Z'
}

function expectSecurityError(promise: Promise<unknown>, statusCode: number, code: string) {
  return expect(promise).rejects.toMatchObject({
    statusCode,
    data: { code }
  })
}

describe('POST /api/tasks - valid creation (US1)', () => {
  beforeEach(() => {
    mockedCreateStudyTask.mockReset()
    mockedGetSubjectForOwner.mockReset()
    mockedGetSubjectForOwner.mockResolvedValue(ownedSubject)
  })

  it('creates a task with a title only', async () => {
    mockedCreateStudyTask.mockResolvedValue({
      id: 'task-1',
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      description: null,
      dueDate: null,
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')

    const result = await handleCreateStudyTask(event, { subjectId: '11111111-1111-1111-1111-111111111111', title: 'Read chapter 3' })

    expect(result).toEqual({
      status: 'created',
      task: {
        id: 'task-1',
        subjectId: '11111111-1111-1111-1111-111111111111',
        title: 'Read chapter 3',
        description: null,
        dueDate: null,
        status: 'pending',
        createdAt: '2026-08-19T00:00:00.000Z'
      }
    })
    expect(mockedGetSubjectForOwner).toHaveBeenCalledWith(testSupabaseClient, 'user-a', '11111111-1111-1111-1111-111111111111')
    expect(mockedCreateStudyTask).toHaveBeenCalledWith(testSupabaseClient, 'user-a', { subjectId: '11111111-1111-1111-1111-111111111111', title: 'Read chapter 3' })
  })

  it('creates a task with a title, description, and due date', async () => {
    mockedCreateStudyTask.mockResolvedValue({
      id: 'task-2',
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      description: 'Focus on section 3.2',
      dueDate: '2026-09-01',
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')

    const result = await handleCreateStudyTask(event, {
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      description: 'Focus on section 3.2',
      dueDate: '2026-09-01'
    })

    expect(result.task.description).toBe('Focus on section 3.2')
    expect(result.task.dueDate).toBe('2026-09-01')
    expect(result.task.status).toBe('pending')
  })

  it('succeeds without description or due date', async () => {
    mockedCreateStudyTask.mockResolvedValue({
      id: 'task-3',
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      description: null,
      dueDate: null,
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')

    await expect(
      handleCreateStudyTask(event, { subjectId: '11111111-1111-1111-1111-111111111111', title: 'Read chapter 3' })
    ).resolves.toMatchObject({ status: 'created' })
  })
})

describe('POST /api/tasks - invalid input rejection (US3)', () => {
  beforeEach(() => {
    mockedCreateStudyTask.mockReset()
    mockedGetSubjectForOwner.mockReset()
    mockedGetSubjectForOwner.mockResolvedValue(ownedSubject)
  })

  it('rejects an empty title without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleCreateStudyTask(event, { subjectId: '11111111-1111-1111-1111-111111111111', title: '' }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateStudyTask).not.toHaveBeenCalled()
  })

  it('rejects a missing subjectId without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleCreateStudyTask(event, { title: 'Read chapter 3' }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateStudyTask).not.toHaveBeenCalled()
  })

  it('rejects a title longer than 100 characters without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleCreateStudyTask(event, { subjectId: '11111111-1111-1111-1111-111111111111', title: 'a'.repeat(101) }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateStudyTask).not.toHaveBeenCalled()
  })

  it('rejects a description longer than 500 characters without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleCreateStudyTask(event, {
        subjectId: '11111111-1111-1111-1111-111111111111',
        title: 'Read chapter 3',
        description: 'a'.repeat(501)
      }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateStudyTask).not.toHaveBeenCalled()
  })

  it('rejects an invalid due date without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleCreateStudyTask(event, {
        subjectId: '11111111-1111-1111-1111-111111111111',
        title: 'Read chapter 3',
        dueDate: 'not-a-date'
      }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateStudyTask).not.toHaveBeenCalled()
  })
})
