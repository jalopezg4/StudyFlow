import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getRecommendedTaskForOwner } from '../../server/utils/tasks/repository'

interface FakeRow {
  id: string
  user_id: string
  subject_id: string
  title: string
  description: string | null
  due_date: string | null
  status: 'pending' | 'completed'
  created_at: string
  subjects: { name: string } | null
}

// Same in-memory Supabase query-builder fake used by list-tasks-repository.spec.ts
// (US07), extended to also support .limit()/.maybeSingle() - real enough to prove
// getRecommendedTaskForOwner's own filter/order/tiebreak logic without a live
// Postgres instance.
function createFakeSupabase(rows: FakeRow[]): SupabaseClient {
  const client = {
    from() {
      let filtered = [...rows]
      const orders: { column: string; ascending: boolean }[] = []
      let limitCount: number | undefined
      let single = false

      const builder = {
        select() {
          return builder
        },
        eq(column: keyof FakeRow, value: unknown) {
          filtered = filtered.filter((row) => row[column] === value)
          return builder
        },
        order(column: string, opts: { ascending: boolean }) {
          orders.push({ column, ascending: opts.ascending })
          return builder
        },
        limit(count: number) {
          limitCount = count
          return builder
        },
        maybeSingle() {
          single = true
          return builder
        },
        then(resolve: (result: { data: FakeRow[] | FakeRow | null; error: null }) => void) {
          const sorted = [...filtered].sort((a, b) => {
            for (const { column, ascending } of orders) {
              const av = (a as unknown as Record<string, unknown>)[column]
              const bv = (b as unknown as Record<string, unknown>)[column]
              if (av === bv) continue
              // Matches PostgreSQL's default NULL ordering: NULLS LAST ascending, NULLS FIRST descending.
              if (av === null) return ascending ? 1 : -1
              if (bv === null) return ascending ? -1 : 1
              if ((av as string) < (bv as string)) return ascending ? -1 : 1
              if ((av as string) > (bv as string)) return ascending ? 1 : -1
            }
            return 0
          })
          const limited = limitCount !== undefined ? sorted.slice(0, limitCount) : sorted
          resolve({ data: single ? (limited[0] ?? null) : limited, error: null })
        }
      }

      return builder
    }
  }

  return client as unknown as SupabaseClient
}

describe('getRecommendedTaskForOwner - ranking (US1)', () => {
  it('recommends the eligible task with the soonest due date', async () => {
    const rows: FakeRow[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Later due date',
        description: null,
        due_date: '2026-09-05',
        status: 'pending',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'Math' }
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Soonest due date',
        description: null,
        due_date: '2026-09-01',
        status: 'pending',
        created_at: '2026-08-02T00:00:00.000Z',
        subjects: { name: 'Math' }
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'No due date',
        description: null,
        due_date: null,
        status: 'pending',
        created_at: '2026-08-03T00:00:00.000Z',
        subjects: { name: 'Math' }
      }
    ]

    const result = await getRecommendedTaskForOwner(createFakeSupabase(rows), 'user-a')

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000002')
  })

  it('recommends an undated task only when no eligible dated task exists', async () => {
    const rows: FakeRow[] = [
      {
        id: '00000000-0000-0000-0000-000000000010',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Older undated task',
        description: null,
        due_date: null,
        status: 'pending',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'Math' }
      },
      {
        id: '00000000-0000-0000-0000-000000000011',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Newer undated task',
        description: null,
        due_date: null,
        status: 'pending',
        created_at: '2026-08-02T00:00:00.000Z',
        subjects: { name: 'Math' }
      }
    ]

    const result = await getRecommendedTaskForOwner(createFakeSupabase(rows), 'user-a')

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000010')
  })

  it('breaks a tie on identical due dates by the oldest createdAt', async () => {
    const rows: FakeRow[] = [
      {
        id: '00000000-0000-0000-0000-000000000020',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Created later',
        description: null,
        due_date: '2026-09-01',
        status: 'pending',
        created_at: '2026-08-05T00:00:00.000Z',
        subjects: { name: 'Math' }
      },
      {
        id: '00000000-0000-0000-0000-000000000021',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Created earlier',
        description: null,
        due_date: '2026-09-01',
        status: 'pending',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'Math' }
      }
    ]

    const result = await getRecommendedTaskForOwner(createFakeSupabase(rows), 'user-a')

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000021')
  })

  it('breaks a tie among multiple undated tasks the same way: oldest createdAt, then id', async () => {
    const rows: FakeRow[] = [
      {
        id: 'bbbbbbbb-0000-0000-0000-000000000000',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Same createdAt, higher id',
        description: null,
        due_date: null,
        status: 'pending',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'Math' }
      },
      {
        id: 'aaaaaaaa-0000-0000-0000-000000000000',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Same createdAt, lower id',
        description: null,
        due_date: null,
        status: 'pending',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'Math' }
      }
    ]

    const result = await getRecommendedTaskForOwner(createFakeSupabase(rows), 'user-a')

    expect(result?.id).toBe('aaaaaaaa-0000-0000-0000-000000000000')
  })

  it('returns the single eligible task when only one exists', async () => {
    const rows: FakeRow[] = [
      {
        id: '00000000-0000-0000-0000-000000000030',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Only task',
        description: null,
        due_date: '2026-09-01',
        status: 'pending',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'Math' }
      }
    ]

    const result = await getRecommendedTaskForOwner(createFakeSupabase(rows), 'user-a')

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000030')
  })

  it('skips a completed task even when it would otherwise rank highest by due date', async () => {
    const rows: FakeRow[] = [
      {
        id: '00000000-0000-0000-0000-000000000040',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Completed, earliest due date',
        description: null,
        due_date: '2026-08-20',
        status: 'completed',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'Math' }
      },
      {
        id: '00000000-0000-0000-0000-000000000041',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Pending, next best due date',
        description: null,
        due_date: '2026-09-01',
        status: 'pending',
        created_at: '2026-08-02T00:00:00.000Z',
        subjects: { name: 'Math' }
      }
    ]

    const result = await getRecommendedTaskForOwner(createFakeSupabase(rows), 'user-a')

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000041')
    expect(result?.status).toBe('pending')
  })

  it('returns the identical recommendation across repeated identical requests, including a tied dataset (FR-003, SC-002)', async () => {
    const tiedRows: FakeRow[] = [
      {
        id: 'bbbbbbbb-0000-0000-0000-000000000001',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Tied A',
        description: null,
        due_date: '2026-09-01',
        status: 'pending',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'Math' }
      },
      {
        id: 'aaaaaaaa-0000-0000-0000-000000000001',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Tied B',
        description: null,
        due_date: '2026-09-01',
        status: 'pending',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'Math' }
      }
    ]

    const first = await getRecommendedTaskForOwner(createFakeSupabase(tiedRows), 'user-a')
    const second = await getRecommendedTaskForOwner(createFakeSupabase(tiedRows), 'user-a')

    expect(first?.id).toBe('aaaaaaaa-0000-0000-0000-000000000001')
    expect(second?.id).toBe(first?.id)
  })
})

describe('getRecommendedTaskForOwner - empty state (US2)', () => {
  it('returns null when the owner has no tasks at all', async () => {
    const result = await getRecommendedTaskForOwner(createFakeSupabase([]), 'user-a')

    expect(result).toBeNull()
  })

  it('returns null when the owner\'s only tasks are all completed', async () => {
    const rows: FakeRow[] = [
      {
        id: '00000000-0000-0000-0000-000000000050',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Completed task',
        description: null,
        due_date: '2026-09-01',
        status: 'completed',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'Math' }
      }
    ]

    const result = await getRecommendedTaskForOwner(createFakeSupabase(rows), 'user-a')

    expect(result).toBeNull()
  })
})

describe('getRecommendedTaskForOwner - ownership isolation (US3)', () => {
  it('never returns another owner\'s task, even when it would rank higher in isolation', async () => {
    const rows: FakeRow[] = [
      {
        id: '00000000-0000-0000-0000-000000000060',
        user_id: 'user-b',
        subject_id: 'subject-2',
        title: 'Student B\'s task (earlier due date)',
        description: null,
        due_date: '2026-08-15',
        status: 'pending',
        created_at: '2026-08-01T00:00:00.000Z',
        subjects: { name: 'History' }
      },
      {
        id: '00000000-0000-0000-0000-000000000061',
        user_id: 'user-a',
        subject_id: 'subject-1',
        title: 'Student A\'s task (later due date)',
        description: null,
        due_date: '2026-09-01',
        status: 'pending',
        created_at: '2026-08-02T00:00:00.000Z',
        subjects: { name: 'Math' }
      }
    ]

    const resultA = await getRecommendedTaskForOwner(createFakeSupabase(rows), 'user-a')
    const resultB = await getRecommendedTaskForOwner(createFakeSupabase(rows), 'user-b')

    expect(resultA?.id).toBe('00000000-0000-0000-0000-000000000061')
    expect(resultB?.id).toBe('00000000-0000-0000-0000-000000000060')
  })
})
