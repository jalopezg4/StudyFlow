import type { SupabaseClient } from '@supabase/supabase-js'

export interface ProgressSummary {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionPercentage: number
  totalStudySessions: number
  totalStudyMinutes: number
  hasActivity: boolean
}

interface TaskStatusRow {
  status: 'pending' | 'completed'
}

interface StudySessionDurationRow {
  duration_minutes: number
}

function calculateCompletionPercentage(totalTasks: number, completedTasks: number): number {
  if (totalTasks === 0) {
    return 0
  }

  return Math.round((completedTasks / totalTasks) * 100)
}

export async function getProgressSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<ProgressSummary> {
  const [tasksResult, sessionsResult] = await Promise.all([
    supabase
      .from('study_tasks')
      .select('status')
      .eq('user_id', userId),
    supabase
      .from('study_sessions')
      .select('duration_minutes')
      .eq('user_id', userId)
  ])

  if (tasksResult.error) {
    throw new Error(tasksResult.error.message)
  }

  if (sessionsResult.error) {
    throw new Error(sessionsResult.error.message)
  }

  const taskRows = (tasksResult.data ?? []) as unknown as TaskStatusRow[]
  const sessionRows = (sessionsResult.data ?? []) as unknown as StudySessionDurationRow[]
  const completedTasks = taskRows.filter((task) => task.status === 'completed').length
  const pendingTasks = taskRows.filter((task) => task.status === 'pending').length
  const totalTasks = taskRows.length
  const totalStudyMinutes = sessionRows.reduce(
    (total, session) => total + session.duration_minutes,
    0
  )
  const totalStudySessions = sessionRows.length

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    completionPercentage: calculateCompletionPercentage(totalTasks, completedTasks),
    totalStudySessions,
    totalStudyMinutes,
    hasActivity: totalTasks > 0 || totalStudySessions > 0
  }
}
