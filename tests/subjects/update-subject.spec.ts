import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent } from '../security/fixtures'

vi.mock('../../server/utils/subjects/repository', () => ({
  updateSubject: vi.fn()
}))

const { updateSubject } = await import('../../server/utils/subjects/repository')
const { handleUpdateSubject } = await import('../../server/api/subjects/[id].patch')

const mockedUpdateSubject = vi.mocked(updateSubject)

function expectSecurityError(promise: Promise<unknown>, statusCode: number, code: string) {
  return expect(promise).rejects.toMatchObject({
    statusCode,
    data: { code }
  })
}

describe('PATCH /api/subjects/:id - valid partial updates (CA02)', () => {
  beforeEach(() => {
    mockedUpdateSubject.mockReset()
  })

  it('updates the name only', async () => {
    mockedUpdateSubject.mockResolvedValue({
      id: 'subject-1',
      name: 'Calculus I - retake',
      description: null,
      createdAt: '2026-08-18T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleUpdateSubject(event, { id: 'subject-1' }, { name: 'Calculus I - retake' })

    expect(result).toEqual({
      status: 'updated',
      subject: {
        id: 'subject-1',
        name: 'Calculus I - retake',
        description: null,
        createdAt: '2026-08-18T00:00:00.000Z'
      }
    })
    expect(mockedUpdateSubject).toHaveBeenCalledWith('user-a', 'subject-1', { name: 'Calculus I - retake' })
  })

  it('updates the description only', async () => {
    mockedUpdateSubject.mockResolvedValue({
      id: 'subject-1',
      name: 'Calculus I',
      description: 'Updated note',
      createdAt: '2026-08-18T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    const result = await handleUpdateSubject(event, { id: 'subject-1' }, { description: 'Updated note' })

    expect(result.subject.description).toBe('Updated note')
    expect(mockedUpdateSubject).toHaveBeenCalledWith('user-a', 'subject-1', { description: 'Updated note' })
  })

  it('updates both fields', async () => {
    mockedUpdateSubject.mockResolvedValue({
      id: 'subject-1',
      name: 'Calculus I',
      description: 'Updated note',
      createdAt: '2026-08-18T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')
    await handleUpdateSubject(event, { id: 'subject-1' }, { name: 'Calculus I', description: 'Updated note' })

    expect(mockedUpdateSubject).toHaveBeenCalledWith('user-a', 'subject-1', {
      name: 'Calculus I',
      description: 'Updated note'
    })
  })
})

describe('PATCH /api/subjects/:id - invalid update rejection (CA02)', () => {
  beforeEach(() => {
    mockedUpdateSubject.mockReset()
  })

  it('rejects a body with neither field present, without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateSubject(event, { id: 'subject-1' }, {}),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateSubject).not.toHaveBeenCalled()
  })

  it('rejects an empty name without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateSubject(event, { id: 'subject-1' }, { name: '' }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateSubject).not.toHaveBeenCalled()
  })

  it('rejects a whitespace-only name without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateSubject(event, { id: 'subject-1' }, { name: '   ' }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateSubject).not.toHaveBeenCalled()
  })

  it('rejects a name longer than 100 characters without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateSubject(event, { id: 'subject-1' }, { name: 'a'.repeat(101) }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateSubject).not.toHaveBeenCalled()
  })

  it('rejects a description longer than 500 characters without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleUpdateSubject(event, { id: 'subject-1' }, { description: 'a'.repeat(501) }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedUpdateSubject).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/subjects/:id - unauthenticated rejection (FR-008)', () => {
  beforeEach(() => {
    mockedUpdateSubject.mockReset()
  })

  it('rejects a request with no authenticated principal before changing any data', async () => {
    const event = createTestEvent()

    await expectSecurityError(
      handleUpdateSubject(event, { id: 'subject-1' }, { name: 'Calculus I' }),
      401,
      'UNAUTHENTICATED'
    )
    expect(mockedUpdateSubject).not.toHaveBeenCalled()
  })
})
