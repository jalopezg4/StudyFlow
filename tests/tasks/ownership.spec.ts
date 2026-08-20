import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent } from '../security/fixtures'

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

describe('POST /api/tasks - unauthenticated rejection', () => {
  beforeEach(() => {
    mockedCreateStudyTask.mockReset()
    mockedGetSubjectForOwner.mockReset()
  })

  it('rejects a request with no authenticated principal before touching persistence', async () => {
    const event = createTestEvent()

    await expect(
      handleCreateStudyTask(event, { subjectId: '11111111-1111-1111-1111-111111111111', title: 'Read chapter 3' })
    ).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHENTICATED' }
    })
    expect(mockedGetSubjectForOwner).not.toHaveBeenCalled()
    expect(mockedCreateStudyTask).not.toHaveBeenCalled()
  })
})

describe('POST /api/tasks - cross-owner subject denial (US2)', () => {
  beforeEach(() => {
    mockedCreateStudyTask.mockReset()
    mockedGetSubjectForOwner.mockReset()
    // Simulates the real owner-scoped query: only Student A's own subject id returns a row.
    mockedGetSubjectForOwner.mockImplementation(async (userId, id) =>
      userId === 'user-a' && id === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        ? { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Calculus I', description: null, createdAt: '2026-08-18T00:00:00.000Z' }
        : null
    )
  })

  it("denies Student B creating a task under Student A's subject, without revealing it exists", async () => {
    const event = createTestEvent('user-b')

    await expect(
      handleCreateStudyTask(event, { subjectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', title: 'Hijacked task' })
    ).rejects.toMatchObject({
      statusCode: 404,
      data: { code: 'NOT_FOUND' }
    })
    expect(mockedCreateStudyTask).not.toHaveBeenCalled()
  })

  it('denies task creation under a subject id that never existed, identically to a cross-owner one', async () => {
    const event = createTestEvent('user-a')

    await expect(
      handleCreateStudyTask(event, { subjectId: '99999999-9999-9999-9999-999999999999', title: 'Some task' })
    ).rejects.toMatchObject({
      statusCode: 404,
      data: { code: 'NOT_FOUND' }
    })
    expect(mockedCreateStudyTask).not.toHaveBeenCalled()
  })

  it('still allows Student A to create a task under their own subject, unaffected by the denials above', async () => {
    mockedCreateStudyTask.mockResolvedValue({
      id: 'task-1',
      subjectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Own task',
      description: null,
      dueDate: null,
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')

    await expect(
      handleCreateStudyTask(event, { subjectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', title: 'Own task' })
    ).resolves.toMatchObject({ status: 'created' })
  })
})

describe('POST /api/tasks - ownership and status cannot be spoofed (FR-007, FR-009)', () => {
  beforeEach(() => {
    mockedCreateStudyTask.mockReset()
    mockedGetSubjectForOwner.mockReset()
    mockedGetSubjectForOwner.mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Calculus I',
      description: null,
      createdAt: '2026-08-18T00:00:00.000Z'
    })
    mockedCreateStudyTask.mockResolvedValue({
      id: 'task-1',
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      description: null,
      dueDate: null,
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    })
  })

  it('ignores an extraneous owner-like field and a client-supplied status, always persisting under the authenticated principal as pending', async () => {
    const event = createTestEvent('user-a')

    await handleCreateStudyTask(event, {
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3',
      userId: 'user-b',
      ownerId: 'user-b',
      status: 'completed'
    })

    expect(mockedCreateStudyTask).toHaveBeenCalledTimes(1)
    expect(mockedCreateStudyTask).toHaveBeenCalledWith('user-a', {
      subjectId: '11111111-1111-1111-1111-111111111111',
      title: 'Read chapter 3'
    })
  })
})

describe('POST /api/tasks - per-request isolation across principals', () => {
  beforeEach(() => {
    mockedCreateStudyTask.mockReset()
    mockedGetSubjectForOwner.mockReset()
    mockedGetSubjectForOwner.mockImplementation(async (userId, id) => ({
      id,
      name: 'Subject',
      description: null,
      createdAt: '2026-08-18T00:00:00.000Z'
    }))
    mockedCreateStudyTask.mockImplementation(async (userId, input) => ({
      id: `task-${userId}`,
      subjectId: input.subjectId,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      status: 'pending',
      createdAt: '2026-08-19T00:00:00.000Z'
    }))
  })

  it('scopes each request to its own authenticated principal, even when handled concurrently', async () => {
    const eventA = createTestEvent('user-a')
    const eventB = createTestEvent('user-b')

    const [resultA, resultB] = await Promise.all([
      handleCreateStudyTask(eventA, { subjectId: 'aaaaaaaa-0000-0000-0000-000000000000', title: 'Task A' }),
      handleCreateStudyTask(eventB, { subjectId: 'bbbbbbbb-0000-0000-0000-000000000000', title: 'Task B' })
    ])

    expect(resultA.task.id).toBe('task-user-a')
    expect(resultB.task.id).toBe('task-user-b')
    expect(mockedCreateStudyTask).toHaveBeenCalledWith('user-a', { subjectId: 'aaaaaaaa-0000-0000-0000-000000000000', title: 'Task A' })
    expect(mockedCreateStudyTask).toHaveBeenCalledWith('user-b', { subjectId: 'bbbbbbbb-0000-0000-0000-000000000000', title: 'Task B' })
  })
})
