import { describe, expect, it, vi } from 'vitest'
import { createStudySession } from '../../server/utils/study-sessions/repository'

const subjectId = '11111111-1111-1111-1111-111111111111'
const taskId = '22222222-2222-2222-2222-222222222222'

function queryResult(data: unknown, error: { message: string } | null = null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data, error })),
    insert: vi.fn(() => query),
    single: vi.fn(async () => ({
      data,
      error
    }))
  }
  return query
}

describe('createStudySession repository', () => {
  it('verifies the owned subject and inserts a subject-only session', async () => {
    const subjectQuery = queryResult({ id: subjectId })
    const sessionQuery = queryResult({
      id: 'session-1',
      subject_id: subjectId,
      task_id: null,
      duration_minutes: 45,
      created_at: '2026-08-20T22:00:00.000Z'
    })
    const supabase = {
      from: vi.fn((table: string) => table === 'subjects' ? subjectQuery : sessionQuery)
    } as never

    await expect(createStudySession(supabase, 'user-a', { subjectId, durationMinutes: 45 })).resolves.toEqual({
      id: 'session-1',
      subjectId,
      taskId: null,
      durationMinutes: 45,
      createdAt: '2026-08-20T22:00:00.000Z'
    })
    expect(sessionQuery.insert).toHaveBeenCalledWith({
      user_id: 'user-a',
      subject_id: subjectId,
      task_id: null,
      duration_minutes: 45
    })
  })

  it('denies a subject not owned by the authenticated user without inserting', async () => {
    const subjectQuery = queryResult(null)
    const sessionQuery = queryResult(null)
    const supabase = {
      from: vi.fn((table: string) => table === 'subjects' ? subjectQuery : sessionQuery)
    } as never

    await expect(createStudySession(supabase, 'user-b', { subjectId, durationMinutes: 45 }))
      .rejects.toMatchObject({ statusCode: 404, data: { code: 'NOT_FOUND' } })
    expect(sessionQuery.insert).not.toHaveBeenCalled()
  })

  it('denies a task that is not owned by the authenticated user or subject', async () => {
    const subjectQuery = queryResult({ id: subjectId })
    const taskQuery = queryResult(null)
    const sessionQuery = queryResult(null)
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'subjects') return subjectQuery
        if (table === 'study_tasks') return taskQuery
        return sessionQuery
      })
    } as never

    await expect(createStudySession(supabase, 'user-a', { subjectId, taskId, durationMinutes: 45 }))
      .rejects.toMatchObject({ statusCode: 404, data: { code: 'NOT_FOUND' } })
    expect(sessionQuery.insert).not.toHaveBeenCalled()
  })
})
