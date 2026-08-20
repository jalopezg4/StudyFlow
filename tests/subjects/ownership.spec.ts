import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/subjects/repository', () => ({
  createSubject: vi.fn(),
  getSubjectForOwner: vi.fn(),
  updateSubject: vi.fn(),
  deleteSubject: vi.fn()
}))

const { createSubject, getSubjectForOwner, updateSubject, deleteSubject } =
  await import('../../server/utils/subjects/repository')
const { handleCreateSubject } = await import('../../server/api/subjects/index.post')
const { handleGetSubject } = await import('../../server/api/subjects/[id].get')
const { handleUpdateSubject } = await import('../../server/api/subjects/[id].patch')
const { handleDeleteSubject } = await import('../../server/api/subjects/[id].delete')

const mockedCreateSubject = vi.mocked(createSubject)
const mockedGetSubjectForOwner = vi.mocked(getSubjectForOwner)
const mockedUpdateSubject = vi.mocked(updateSubject)
const mockedDeleteSubject = vi.mocked(deleteSubject)

function notFoundError() {
  return Object.assign(new Error('Subject not found'), {
    statusCode: 404,
    statusMessage: 'Subject not found',
    data: { code: 'NOT_FOUND', message: 'Subject not found' }
  })
}

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
    expect(mockedCreateSubject).toHaveBeenCalledWith(testSupabaseClient, 'user-a', { name: 'Calculus I' })
  })
})

describe('POST /api/subjects - per-request isolation across principals (SC-005)', () => {
  // A real Postgres RLS check requires a live Supabase project and is out of
  // reach for this unit suite (see specs/004-subject-management/research.md,
  // Decision 5). This verifies the application layer never lets one
  // authenticated request's owner id leak into another's persistence call.
  beforeEach(() => {
    mockedCreateSubject.mockReset()
    mockedCreateSubject.mockImplementation(async (_supabase, userId, input) => ({
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
    expect(mockedCreateSubject).toHaveBeenCalledWith(testSupabaseClient, 'user-a', { name: 'Subject A' })
    expect(mockedCreateSubject).toHaveBeenCalledWith(testSupabaseClient, 'user-b', { name: 'Subject B' })
  })
})

describe('GET /api/subjects/:id - cross-owner denial (CA03 AC3, FR-006, FR-007)', () => {
  beforeEach(() => {
    mockedGetSubjectForOwner.mockReset()
    // Simulates the real owner-scoped query: only Student A's own id returns a row.
    mockedGetSubjectForOwner.mockImplementation(async (_supabase, userId, id) =>
      userId === 'user-a' && id === 'subject-a1'
        ? { id: 'subject-a1', name: 'Calculus I', description: null, createdAt: '2026-08-18T00:00:00.000Z' }
        : null
    )
  })

  it('denies Student B viewing Student A\'s subject directly, without revealing it exists', async () => {
    const event = createTestEvent('user-b')

    await expect(handleGetSubject(event, { id: 'subject-a1' })).rejects.toMatchObject({
      statusCode: 404,
      data: { code: 'NOT_FOUND' }
    })
  })

  it('still allows Student A to view their own subject, unaffected by the denial above', async () => {
    const event = createTestEvent('user-a')

    await expect(handleGetSubject(event, { id: 'subject-a1' })).resolves.toMatchObject({
      status: 'ok',
      subject: { id: 'subject-a1' }
    })
  })
})

describe('PATCH /api/subjects/:id - cross-owner denial (CA03 AC1, FR-006, FR-007)', () => {
  beforeEach(() => {
    mockedUpdateSubject.mockReset()
    mockedUpdateSubject.mockRejectedValue(notFoundError())
  })

  it('denies Student B editing Student A\'s subject and changes nothing', async () => {
    const event = createTestEvent('user-b')

    await expect(
      handleUpdateSubject(event, { id: 'subject-a1' }, { name: 'Hijacked name' })
    ).rejects.toMatchObject({
      statusCode: 404,
      data: { code: 'NOT_FOUND' }
    })
    expect(mockedUpdateSubject).toHaveBeenCalledWith(testSupabaseClient, 'user-b', 'subject-a1', { name: 'Hijacked name' })
  })
})

describe('DELETE /api/subjects/:id - cross-owner denial (CA03 AC2, FR-006, FR-007)', () => {
  beforeEach(() => {
    mockedDeleteSubject.mockReset()
    mockedDeleteSubject.mockRejectedValue(notFoundError())
  })

  it('denies Student B deleting Student A\'s subject and it remains present', async () => {
    const event = createTestEvent('user-b')

    await expect(handleDeleteSubject(event, { id: 'subject-a1' })).rejects.toMatchObject({
      statusCode: 404,
      data: { code: 'NOT_FOUND' }
    })
    expect(mockedDeleteSubject).toHaveBeenCalledWith(testSupabaseClient, 'user-b', 'subject-a1')
  })
})

describe('Nonexistent subject id is indistinguishable from a non-owned one (FR-007)', () => {
  beforeEach(() => {
    mockedGetSubjectForOwner.mockReset()
    mockedUpdateSubject.mockReset()
    mockedDeleteSubject.mockReset()
    mockedGetSubjectForOwner.mockResolvedValue(null)
    mockedUpdateSubject.mockRejectedValue(notFoundError())
    mockedDeleteSubject.mockRejectedValue(notFoundError())
  })

  it('returns the same 404 NOT_FOUND shape for GET on an id that never existed', async () => {
    const event = createTestEvent('user-a')

    await expect(handleGetSubject(event, { id: 'never-existed' })).rejects.toMatchObject({
      statusCode: 404,
      data: { code: 'NOT_FOUND' }
    })
  })

  it('returns the same 404 NOT_FOUND shape for PATCH on an id that never existed', async () => {
    const event = createTestEvent('user-a')

    await expect(
      handleUpdateSubject(event, { id: 'never-existed' }, { name: 'Does not matter' })
    ).rejects.toMatchObject({
      statusCode: 404,
      data: { code: 'NOT_FOUND' }
    })
  })

  it('returns the same 404 NOT_FOUND shape for DELETE on an id that never existed', async () => {
    const event = createTestEvent('user-a')

    await expect(handleDeleteSubject(event, { id: 'never-existed' })).rejects.toMatchObject({
      statusCode: 404,
      data: { code: 'NOT_FOUND' }
    })
  })
})
