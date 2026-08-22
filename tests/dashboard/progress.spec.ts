import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/dashboard/repository', () => ({
  getProgressSummary: vi.fn()
}))

const { getProgressSummary } = await import('../../server/utils/dashboard/repository')
const { handleGetProgress } = await import('../../server/api/dashboard/progress.get')
const mockedGetProgressSummary = vi.mocked(getProgressSummary)

const progress = {
  totalTasks: 4,
  completedTasks: 2,
  pendingTasks: 2,
  completionPercentage: 50,
  totalStudySessions: 3,
  totalStudyMinutes: 135,
  hasActivity: true
}

function expectSecurityError(promise: Promise<unknown>, statusCode: number, code: string) {
  return expect(promise).rejects.toMatchObject({ statusCode, data: { code } })
}

describe('GET /api/dashboard/progress', () => {
  beforeEach(() => {
    mockedGetProgressSummary.mockReset()
  })

  it('returns the authenticated user progress summary', async () => {
    mockedGetProgressSummary.mockResolvedValue(progress)

    await expect(handleGetProgress(createTestEvent('user-a'))).resolves.toEqual({
      status: 'ok',
      progress
    })
    expect(mockedGetProgressSummary).toHaveBeenCalledWith(testSupabaseClient, 'user-a')
  })

  it('returns a valid empty state', async () => {
    const emptyProgress = {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      completionPercentage: 0,
      totalStudySessions: 0,
      totalStudyMinutes: 0,
      hasActivity: false
    }
    mockedGetProgressSummary.mockResolvedValue(emptyProgress)

    await expect(handleGetProgress(createTestEvent('user-a'))).resolves.toEqual({
      status: 'ok',
      progress: emptyProgress
    })
  })

  it('rejects unauthenticated requests before aggregation', async () => {
    await expectSecurityError(handleGetProgress(createTestEvent()), 401, 'UNAUTHENTICATED')
    expect(mockedGetProgressSummary).not.toHaveBeenCalled()
  })
})
