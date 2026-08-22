import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getProgressSummary } from '../../server/utils/dashboard/repository'

interface TaskRow {
  user_id: string
  status: 'pending' | 'completed'
}

interface SessionRow {
  user_id: string
  duration_minutes: number
}

function createFakeSupabase(tasks: TaskRow[], sessions: SessionRow[]): SupabaseClient {
  const client = {
    from(table: string) {
      const rows = table === 'study_tasks' ? tasks : sessions
      let filtered = [...rows]
      const builder = {
        select() {
          return builder
        },
        eq(column: keyof TaskRow | keyof SessionRow, value: unknown) {
          filtered = filtered.filter((row) => row[column] === value)
          return builder
        },
        then(resolve: (result: { data: typeof rows; error: null }) => void) {
          resolve({ data: filtered, error: null })
        }
      }
      return builder
    }
  }

  return client as unknown as SupabaseClient
}

describe('getProgressSummary', () => {
  it('calculates task and study-session metrics for one owner', async () => {
    const result = await getProgressSummary(
      createFakeSupabase(
        [
          { user_id: 'user-a', status: 'completed' },
          { user_id: 'user-a', status: 'completed' },
          { user_id: 'user-a', status: 'pending' },
          { user_id: 'user-b', status: 'completed' }
        ],
        [
          { user_id: 'user-a', duration_minutes: 45 },
          { user_id: 'user-a', duration_minutes: 90 },
          { user_id: 'user-b', duration_minutes: 1000 }
        ]
      ),
      'user-a'
    )

    expect(result).toEqual({
      totalTasks: 3,
      completedTasks: 2,
      pendingTasks: 1,
      completionPercentage: 67,
      totalStudySessions: 2,
      totalStudyMinutes: 135,
      hasActivity: true
    })
  })

  it('returns a zero-valued empty state when the owner has no activity', async () => {
    await expect(getProgressSummary(createFakeSupabase([], []), 'user-a')).resolves.toEqual({
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      completionPercentage: 0,
      totalStudySessions: 0,
      totalStudyMinutes: 0,
      hasActivity: false
    })
  })

  it('includes task-only activity without study time', async () => {
    await expect(
      getProgressSummary(
        createFakeSupabase([{ user_id: 'user-a', status: 'pending' }], []),
        'user-a'
      )
    ).resolves.toMatchObject({
      totalTasks: 1,
      pendingTasks: 1,
      totalStudySessions: 0,
      totalStudyMinutes: 0,
      hasActivity: true
    })
  })

  it('fails the whole summary when a source query fails', async () => {
    const failingClient = {
      from(table: string) {
        const builder = {
          select() {
            return builder
          },
          eq() {
            return builder
          },
          then(resolve: (result: { data: unknown[]; error: { message: string } | null }) => void) {
            resolve({
              data: [],
              error: table === 'study_sessions' ? { message: 'database unavailable' } : null
            })
          }
        }
        return builder
      }
    } as unknown as SupabaseClient

    await expect(getProgressSummary(failingClient, 'user-a')).rejects.toThrow('database unavailable')
  })
})
