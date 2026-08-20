import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent, testSupabaseClient } from '../security/fixtures'

vi.mock('../../server/utils/subjects/repository', () => ({
  deleteSubject: vi.fn(),
  listSubjectsForOwner: vi.fn()
}))

const { deleteSubject, listSubjectsForOwner } = await import('../../server/utils/subjects/repository')
const { handleDeleteSubject } = await import('../../server/api/subjects/[id].delete')

const mockedDeleteSubject = vi.mocked(deleteSubject)
const mockedListSubjectsForOwner = vi.mocked(listSubjectsForOwner)

describe('DELETE /api/subjects/:id - delete an eligible subject (CA04, allowed case)', () => {
  beforeEach(() => {
    mockedDeleteSubject.mockReset()
    mockedListSubjectsForOwner.mockReset()
  })

  it('deletes a subject with no dependents and it no longer appears in a subsequent listing', async () => {
    const fakeStore = [
      { id: 'subject-1', name: 'Calculus I', description: null, createdAt: '2026-08-18T00:00:00.000Z' }
    ]

    mockedDeleteSubject.mockImplementation(async (_supabase, _userId, id) => {
      const index = fakeStore.findIndex((subject) => subject.id === id)
      fakeStore.splice(index, 1)
    })
    mockedListSubjectsForOwner.mockImplementation(async () => [...fakeStore])

    const event = createTestEvent('user-a')
    const result = await handleDeleteSubject(event, { id: 'subject-1' })

    expect(result).toEqual({ status: 'deleted', id: 'subject-1' })
    expect(mockedDeleteSubject).toHaveBeenCalledWith(testSupabaseClient, 'user-a', 'subject-1')

    const listing = await listSubjectsForOwner('user-a')
    expect(listing).toEqual([])
  })
})

describe('DELETE /api/subjects/:id - blocked by dependency (CA04, blocked case)', () => {
  beforeEach(() => {
    mockedDeleteSubject.mockReset()
  })

  it('translates a foreign-key-violation into 409 CONFLICT without deleting the subject', async () => {
    mockedDeleteSubject.mockRejectedValue(
      Object.assign(new Error('blocked'), {
        statusCode: 409,
        statusMessage: 'Subject has associated study tasks and cannot be deleted',
        data: { code: 'CONFLICT', message: 'Subject has associated study tasks and cannot be deleted' }
      })
    )

    const event = createTestEvent('user-a')

    await expect(handleDeleteSubject(event, { id: 'subject-1' })).rejects.toMatchObject({
      statusCode: 409,
      data: { code: 'CONFLICT' }
    })
  })
})

describe('DELETE /api/subjects/:id - nonexistent subject (FR-007)', () => {
  beforeEach(() => {
    mockedDeleteSubject.mockReset()
  })

  it('returns 404 NOT_FOUND when no owned row matches the id', async () => {
    mockedDeleteSubject.mockRejectedValue(
      Object.assign(new Error('not found'), {
        statusCode: 404,
        statusMessage: 'Subject not found',
        data: { code: 'NOT_FOUND', message: 'Subject not found' }
      })
    )

    const event = createTestEvent('user-a')

    await expect(handleDeleteSubject(event, { id: 'nonexistent' })).rejects.toMatchObject({
      statusCode: 404,
      data: { code: 'NOT_FOUND' }
    })
  })
})

describe('DELETE /api/subjects/:id - unauthenticated rejection (FR-008)', () => {
  beforeEach(() => {
    mockedDeleteSubject.mockReset()
  })

  it('rejects a request with no authenticated principal before deleting anything', async () => {
    const event = createTestEvent()

    await expect(handleDeleteSubject(event, { id: 'subject-1' })).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'UNAUTHENTICATED' }
    })
    expect(mockedDeleteSubject).not.toHaveBeenCalled()
  })
})
