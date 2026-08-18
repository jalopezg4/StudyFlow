import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestEvent } from '../security/fixtures'

vi.mock('../../server/utils/subjects/repository', () => ({
  createSubject: vi.fn()
}))

const { createSubject } = await import('../../server/utils/subjects/repository')
const { handleCreateSubject } = await import('../../server/api/subjects/index.post')

const mockedCreateSubject = vi.mocked(createSubject)

function expectSecurityError(promise: Promise<unknown>, statusCode: number, code: string) {
  return expect(promise).rejects.toMatchObject({
    statusCode,
    data: { code }
  })
}

describe('POST /api/subjects - valid creation (CA01)', () => {
  beforeEach(() => {
    mockedCreateSubject.mockReset()
  })

  it('creates a subject with a name only', async () => {
    mockedCreateSubject.mockResolvedValue({
      id: 'subject-1',
      name: 'Calculus I',
      description: null,
      createdAt: '2026-08-18T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')

    const result = await handleCreateSubject(event, { name: 'Calculus I' })

    expect(result).toEqual({
      status: 'created',
      subject: {
        id: 'subject-1',
        name: 'Calculus I',
        description: null,
        createdAt: '2026-08-18T00:00:00.000Z'
      }
    })
    expect(mockedCreateSubject).toHaveBeenCalledWith('user-a', { name: 'Calculus I' })
  })

  it('creates a subject with a name and description', async () => {
    mockedCreateSubject.mockResolvedValue({
      id: 'subject-2',
      name: 'Physics I',
      description: 'Mechanics and thermodynamics',
      createdAt: '2026-08-18T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')

    const result = await handleCreateSubject(event, {
      name: 'Physics I',
      description: 'Mechanics and thermodynamics'
    })

    expect(result.subject.description).toBe('Mechanics and thermodynamics')
    expect(mockedCreateSubject).toHaveBeenCalledWith('user-a', {
      name: 'Physics I',
      description: 'Mechanics and thermodynamics'
    })
  })

  it('succeeds without a description', async () => {
    mockedCreateSubject.mockResolvedValue({
      id: 'subject-3',
      name: 'History',
      description: null,
      createdAt: '2026-08-18T00:00:00.000Z'
    })

    const event = createTestEvent('user-a')

    await expect(handleCreateSubject(event, { name: 'History' })).resolves.toMatchObject({
      status: 'created'
    })
  })
})

describe('POST /api/subjects - invalid input rejection (CA02)', () => {
  beforeEach(() => {
    mockedCreateSubject.mockReset()
  })

  it('rejects an empty name without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleCreateSubject(event, { name: '' }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateSubject).not.toHaveBeenCalled()
  })

  it('rejects a whitespace-only name without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleCreateSubject(event, { name: '   ' }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateSubject).not.toHaveBeenCalled()
  })

  it('rejects a missing name without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleCreateSubject(event, {}),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateSubject).not.toHaveBeenCalled()
  })

  it('rejects a name longer than 100 characters without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleCreateSubject(event, { name: 'a'.repeat(101) }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateSubject).not.toHaveBeenCalled()
  })

  it('rejects a description longer than 500 characters without persisting', async () => {
    const event = createTestEvent('user-a')

    await expectSecurityError(
      handleCreateSubject(event, { name: 'Valid Name', description: 'a'.repeat(501) }),
      422,
      'VALIDATION_ERROR'
    )
    expect(mockedCreateSubject).not.toHaveBeenCalled()
  })
})
