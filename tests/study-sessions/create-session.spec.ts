import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/study-sessions/repository', () => ({
  createStudySession: vi.fn()
}))

const { createStudySession } = await import('../../server/utils/study-sessions/repository')
const { handleCreateStudySession } = await import('../../server/api/study-sessions/index.post')

const mockedCreateStudySession = vi.mocked(createStudySession)
const subjectId = '11111111-1111-1111-1111-111111111111'
const taskId = '22222222-2222-2222-2222-222222222222'

function expectSecurityError(promise: Promise<unknown>, statusCode: number, code: string) {
  return expect(promise).rejects.toMatchObject({ statusCode, data: { code } })
}

describe('POST /api/study-sessions', () => {
  beforeEach(() => {
    mockedCreateStudySession.mockReset()
  })

  it('creates a subject-only session for the authenticated owner', async () => {
    mockedCreateStudySession.mockResolvedValue({
      id: 'session-1',
      subjectId,
      taskId: null,
      durationMinutes: 45,
      createdAt: '2026-08-20T22:00:00.000Z'
    })

    const result = await handleCreateStudySession(createTestEvent('user-a'), {
      subjectId,
      durationMinutes: 45
    })

    expect(result).toEqual({
      status: 'created',
      studySession: {
        id: 'session-1',
        subjectId,
        taskId: null,
        durationMinutes: 45,
        createdAt: '2026-08-20T22:00:00.000Z'
      }
    })
    expect(mockedCreateStudySession).toHaveBeenCalledWith(testSupabaseClient, 'user-a', {
      subjectId,
      durationMinutes: 45
    })
  })

  it('creates a task-linked session', async () => {
    mockedCreateStudySession.mockResolvedValue({
      id: 'session-2',
      subjectId,
      taskId,
      durationMinutes: 90,
      createdAt: '2026-08-20T22:00:00.000Z'
    })

    const result = await handleCreateStudySession(createTestEvent('user-a'), {
      subjectId,
      taskId,
      durationMinutes: 90
    })

    expect(result.studySession.taskId).toBe(taskId)
  })

  it.each([
    ['missing duration', { subjectId }],
    ['zero duration', { subjectId, durationMinutes: 0 }],
    ['negative duration', { subjectId, durationMinutes: -5 }],
    ['decimal duration', { subjectId, durationMinutes: 1.5 }],
    ['over-limit duration', { subjectId, durationMinutes: 1441 }]
  ])('rejects %s before repository persistence', async (_caseName, body) => {
    await expectSecurityError(
      handleCreateStudySession(createTestEvent('user-a'), body),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateStudySession).not.toHaveBeenCalled()
  })

  it('rejects an unauthenticated request before repository persistence', async () => {
    await expectSecurityError(
      handleCreateStudySession(createTestEvent(), { subjectId, durationMinutes: 45 }),
      401,
      'UNAUTHENTICATED'
    )
    expect(mockedCreateStudySession).not.toHaveBeenCalled()
  })
})
