import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent } from '../security/fixtures'

vi.mock('../../server/utils/subjects/repository', () => ({
  createSubject: vi.fn()
}))

const { createSubject } = await import('../../server/utils/subjects/repository')
const { handleCreateSubject } = await import('../../server/api/subjects/index.post')

const mockedCreateSubject = vi.mocked(createSubject)

describe('POST /api/subjects - unauthenticated rejection (CA03)', () => {
  beforeEach(() => {
    mockedCreateSubject.mockReset()
  })

  it('rejects a request with no authenticated principal before touching persistence', async () => {
    const event = createTestEvent()

    await expect(handleCreateSubject(event, { name: 'Calculus I' })).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHENTICATED' }
    })
    expect(mockedCreateSubject).not.toHaveBeenCalled()
  })
})

describe('POST /api/subjects - ownership cannot be spoofed (FR-007, FR-010)', () => {
  beforeEach(() => {
    mockedCreateSubject.mockReset()
    mockedCreateSubject.mockResolvedValue({
      id: 'subject-1',
      name: 'Calculus I',
      description: null,
      createdAt: '2026-08-18T00:00:00.000Z'
    })
  })

  it('ignores an extraneous owner-like field and always persists under the authenticated principal', async () => {
    const event = createTestEvent('user-a')

    await handleCreateSubject(event, {
      name: 'Calculus I',
      userId: 'user-b',
      ownerId: 'user-b'
    })

    expect(mockedCreateSubject).toHaveBeenCalledTimes(1)
    expect(mockedCreateSubject).toHaveBeenCalledWith('user-a', { name: 'Calculus I' })
  })
})

describe('POST /api/subjects - per-request isolation across principals (SC-005)', () => {
  // A real Postgres RLS check requires a live Supabase project and is out of
  // reach for this unit suite (see specs/004-subject-management/research.md,
  // Decision 5). This verifies the application layer never lets one
  // authenticated request's owner id leak into another's persistence call.
  beforeEach(() => {
    mockedCreateSubject.mockReset()
    mockedCreateSubject.mockImplementation(async (userId, input) => ({
      id: `subject-${userId}`,
      name: input.name,
      description: input.description ?? null,
      createdAt: '2026-08-18T00:00:00.000Z'
    }))
  })

  it('scopes each request to its own authenticated principal, even when handled concurrently', async () => {
    const eventA = createTestEvent('user-a')
    const eventB = createTestEvent('user-b')

    const [resultA, resultB] = await Promise.all([
      handleCreateSubject(eventA, { name: 'Subject A' }),
      handleCreateSubject(eventB, { name: 'Subject B' })
    ])

    expect(resultA.subject.id).toBe('subject-user-a')
    expect(resultB.subject.id).toBe('subject-user-b')
    expect(mockedCreateSubject).toHaveBeenCalledWith('user-a', { name: 'Subject A' })
    expect(mockedCreateSubject).toHaveBeenCalledWith('user-b', { name: 'Subject B' })
  })
})
