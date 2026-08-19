import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent } from '../security/fixtures'

vi.mock('../../server/utils/subjects/repository', () => ({
  getSubjectForOwner: vi.fn()
}))

const { getSubjectForOwner } = await import('../../server/utils/subjects/repository')
const { handleGetSubject } = await import('../../server/api/subjects/[id].get')

const mockedGetSubjectForOwner = vi.mocked(getSubjectForOwner)

describe('GET /api/subjects/:id - retrieve an owned subject (CA03 AC3, positive path)', () => {
  beforeEach(() => {
    mockedGetSubjectForOwner.mockReset()
  })

  it('returns the subject when it belongs to the requesting principal', async () => {
    mockedGetSubjectForOwner.mockResolvedValue({
      id: 'subject-1',
      name: 'Calculus I',
      description: 'Limits, derivatives, integrals',
      createdAt: '2026-08-18T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleGetSubject(event, { id: 'subject-1' })

    expect(result).toEqual({
      status: 'ok',
      subject: {
        id: 'subject-1',
        name: 'Calculus I',
        description: 'Limits, derivatives, integrals',
        createdAt: '2026-08-18T00:00:00.000Z'
      }
    })
    expect(mockedGetSubjectForOwner).toHaveBeenCalledWith('user-a', 'subject-1')
  })
})

describe('GET /api/subjects/:id - unauthenticated rejection (FR-008)', () => {
  beforeEach(() => {
    mockedGetSubjectForOwner.mockReset()
  })

  it('rejects a request with no authenticated principal before reading any data', async () => {
    const event = createTestEvent()

    await expect(handleGetSubject(event, { id: 'subject-1' })).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHENTICATED' }
    })
    expect(mockedGetSubjectForOwner).not.toHaveBeenCalled()
  })
})

// Cross-owner and nonexistent-id denial cases for this endpoint live in
// tests/subjects/ownership.spec.ts (User Story 3), not here — see
// specs/005-manage-subjects/tasks.md T028/T031.
