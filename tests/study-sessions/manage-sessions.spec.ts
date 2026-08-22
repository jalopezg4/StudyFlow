import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/study-sessions/repository', () => ({
  listStudySessionsForOwner: vi.fn(),
  updateStudySession: vi.fn(),
  deleteStudySession: vi.fn()
}))

const repository = await import('../../server/utils/study-sessions/repository')
const { handleListStudySessions } = await import('../../server/api/study-sessions/index.get')
const { handleUpdateStudySession } = await import('../../server/api/study-sessions/[id].patch')
const { handleDeleteStudySession } = await import('../../server/api/study-sessions/[id].delete')

const mockedList = vi.mocked(repository.listStudySessionsForOwner)
const mockedUpdate = vi.mocked(repository.updateStudySession)
const mockedDelete = vi.mocked(repository.deleteStudySession)
const sessionId = '33333333-3333-3333-3333-333333333333'
const subjectId = '11111111-1111-1111-1111-111111111111'

function expectSecurityError(promise: Promise<unknown>, statusCode: number, code: string) {
  return expect(promise).rejects.toMatchObject({ statusCode, data: { code } })
}

describe('manage study sessions', () => {
  beforeEach(() => {
    mockedList.mockReset()
    mockedUpdate.mockReset()
    mockedDelete.mockReset()
  })

  it('lists only the authenticated owner sessions', async () => {
    mockedList.mockResolvedValue([])
    await expect(handleListStudySessions(createTestEvent('user-a'))).resolves.toEqual({ status: 'ok', sessions: [] })
    expect(mockedList).toHaveBeenCalledWith(testSupabaseClient, 'user-a')
  })

  it('updates a session duration', async () => {
    mockedUpdate.mockResolvedValue({ id: sessionId, subjectId, taskId: null, durationMinutes: 60, createdAt: '2026-08-21T00:00:00.000Z' })
    const result = await handleUpdateStudySession(createTestEvent('user-a'), { durationMinutes: 60 }, { id: sessionId })
    expect(result.status).toBe('updated')
    expect(result.studySession.durationMinutes).toBe(60)
    expect(mockedUpdate).toHaveBeenCalledWith(testSupabaseClient, 'user-a', sessionId, { durationMinutes: 60 })
  })

  it('rejects an invalid duration before update', async () => {
    await expectSecurityError(
      handleUpdateStudySession(createTestEvent('user-a'), { durationMinutes: 0 }, { id: sessionId }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('deletes an owned session', async () => {
    mockedDelete.mockResolvedValue()
    await expect(handleDeleteStudySession(createTestEvent('user-a'), { id: sessionId })).resolves.toEqual({ status: 'deleted', id: sessionId })
    expect(mockedDelete).toHaveBeenCalledWith(testSupabaseClient, 'user-a', sessionId)
  })

  it('rejects unauthenticated management requests', async () => {
    await expectSecurityError(handleListStudySessions(createTestEvent()), 401, 'UNAUTHENTICATED')
    await expectSecurityError(handleDeleteStudySession(createTestEvent(), { id: sessionId }), 401, 'UNAUTHENTICATED')
  })
})
