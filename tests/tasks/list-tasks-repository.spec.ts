import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { listStudyTasksForOwner } from '../../server/utils/tasks/repository'

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

// An in-memory stand-in for the Supabase query builder: real enough to prove
// listStudyTasksForOwner's own filter/sort/tiebreaker logic (FR-003/004/009/
// 011/012/013) without a live Postgres instance, consistent with how ownership
// (`user_id`) filtering is already trusted-but-not-simulated elsewhere in this
// suite. Only `.eq()`/`.order()` are recorded and actually applied; anything
// beyond that (RLS, real Postgres NULL-ordering edge cases) remains deferred
// to manual/integration testing, same as HU06.
function createFakeSupabase(rows: FakeRow[]): SupabaseClient {
  const client = {
    from() {
      let filtered = [...rows]
      const orders: { column: string; ascending: boolean }[] = []

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
        then(resolve: (result: { data: FakeRow[]; error: null }) => void) {
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
          resolve({ data: sorted, error: null })
        }
      }

      return builder
    }
  }

  return client as unknown as SupabaseClient
}

const rows: FakeRow[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    user_id: 'user-a',
    subject_id: 'subject-math',
    title: 'Algebra homework',
    description: null,
    due_date: '2026-09-05',
    status: 'pending',
    created_at: '2026-08-01T00:00:00.000Z',
    subjects: { name: 'Math' }
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    user_id: 'user-a',
    subject_id: 'subject-history',
    title: 'Read chapter 3',
    description: null,
    due_date: '2026-09-01',
    status: 'completed',
    created_at: '2026-08-02T00:00:00.000Z',
    subjects: { name: 'History' }
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    user_id: 'user-a',
    subject_id: 'subject-math',
    title: 'Bring calculator',
    description: null,
    due_date: null,
    status: 'pending',
    created_at: '2026-08-03T00:00:00.000Z',
    subjects: { name: 'Math' }
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    user_id: 'user-b',
    subject_id: 'subject-other-student',
    title: 'Another student\'s task',
    description: null,
    due_date: '2026-09-01',
    status: 'pending',
    created_at: '2026-08-04T00:00:00.000Z',
    subjects: { name: 'Someone Else\'s Subject' }
  }
]

describe('listStudyTasksForOwner - filtering (US1)', () => {
  it('filters by status, scoped to the owner', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', { status: 'pending' })

    // Default order (createdAt desc) still applies since no sort was requested: task 3 (08-03) before task 1 (08-01).
    expect(result.map((t) => t.id)).toEqual([
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000001'
    ])
  })

  it('filters by an owned subjectId', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', { subjectId: 'subject-history' })

    expect(result.map((t) => t.id)).toEqual(['00000000-0000-0000-0000-000000000002'])
  })

  it('returns an empty array for a subjectId that belongs to a different student, not that student\'s data', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', {
      subjectId: 'subject-other-student'
    })

    expect(result).toEqual([])
  })

  it('returns an empty array for a well-formed subjectId that matches no task at all', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', {
      subjectId: 'subject-does-not-exist'
    })

    expect(result).toEqual([])
  })

  it('combines status and subjectId with AND semantics', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', {
      status: 'pending',
      subjectId: 'subject-math'
    })

    expect(result.map((t) => t.id)).toEqual([
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000001'
    ])
  })

  it('returns an empty array when a supported filter matches none of the owner\'s tasks', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', {
      status: 'completed',
      subjectId: 'subject-math'
    })

    expect(result).toEqual([])
  })
})

describe('listStudyTasksForOwner - sorting (US2)', () => {
  it('sorts by due date ascending, nulls last', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', undefined, {
      by: 'dueDate',
      direction: 'asc'
    })

    expect(result.map((t) => t.id)).toEqual([
      '00000000-0000-0000-0000-000000000002', // 2026-09-01
      '00000000-0000-0000-0000-000000000001', // 2026-09-05
      '00000000-0000-0000-0000-000000000003' // null
    ])
  })

  it('sorts by due date descending as the exact reverse, nulls first', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', undefined, {
      by: 'dueDate',
      direction: 'desc'
    })

    expect(result.map((t) => t.id)).toEqual([
      '00000000-0000-0000-0000-000000000003', // null
      '00000000-0000-0000-0000-000000000001', // 2026-09-05
      '00000000-0000-0000-0000-000000000002' // 2026-09-01
    ])
  })

  it('defaults dueDate sort to ascending when no direction is supplied', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', undefined, { by: 'dueDate' })

    expect(result.map((t) => t.id)[0]).toBe('00000000-0000-0000-0000-000000000002')
  })

  it('defaults createdAt sort to descending when no direction is supplied', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', undefined, { by: 'createdAt' })

    expect(result.map((t) => t.id)).toEqual([
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000001'
    ])
  })

  it('defaults title sort to ascending when no direction is supplied', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', undefined, { by: 'title' })

    expect(result.map((t) => t.title)).toEqual(['Algebra homework', 'Bring calculator', 'Read chapter 3'])
  })

  it('sorts by title descending as the exact reverse', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a', undefined, {
      by: 'title',
      direction: 'desc'
    })

    expect(result.map((t) => t.title)).toEqual(['Read chapter 3', 'Bring calculator', 'Algebra homework'])
  })

  it('reproduces the exact HU06 default order (createdAt desc) when no sort is supplied at all', async () => {
    const result = await listStudyTasksForOwner(createFakeSupabase(rows), 'user-a')

    expect(result.map((t) => t.id)).toEqual([
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000001'
    ])
  })

  it('breaks a tie on the active sort criterion deterministically by id, across repeated identical requests', async () => {
    const tiedRows: FakeRow[] = [
      { ...rows[0]!, id: 'bbbbbbbb-0000-0000-0000-000000000000', due_date: '2026-09-10' },
      { ...rows[0]!, id: 'aaaaaaaa-0000-0000-0000-000000000000', due_date: '2026-09-10' }
    ]

    const first = await listStudyTasksForOwner(createFakeSupabase(tiedRows), 'user-a', undefined, { by: 'dueDate' })
    const second = await listStudyTasksForOwner(createFakeSupabase(tiedRows), 'user-a', undefined, { by: 'dueDate' })

    expect(first.map((t) => t.id)).toEqual([
      'aaaaaaaa-0000-0000-0000-000000000000',
      'bbbbbbbb-0000-0000-0000-000000000000'
    ])
    expect(second.map((t) => t.id)).toEqual(first.map((t) => t.id))
  })
})

describe('listStudyTasksForOwner - filter and sort combined (US4)', () => {
  it('satisfies the filter and the sort simultaneously', async () => {
    const result = await listStudyTasksForOwner(
      createFakeSupabase(rows),
      'user-a',
      { status: 'pending' },
      { by: 'dueDate', direction: 'asc' }
    )

    expect(result.map((t) => t.id)).toEqual([
      '00000000-0000-0000-0000-000000000001', // 2026-09-05
      '00000000-0000-0000-0000-000000000003' // null
    ])
    expect(result.every((t) => t.status === 'pending')).toBe(true)
  })
})
