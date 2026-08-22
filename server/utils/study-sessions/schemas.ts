import { z } from 'zod'
import { createSafeHttpError } from '../security/errors'

export const StudySessionIdParamSchema = z.object({
  id: z.string().trim().uuid()
})

export function parseStudySessionId(rawParams: unknown): string {
  const parsed = StudySessionIdParamSchema.safeParse(rawParams)

  if (!parsed.success) {
    throw createSafeHttpError(404, 'NOT_FOUND', 'Study session not found')
  }

  return parsed.data.id
}

export const CreateStudySessionSchema = z.object({
  subjectId: z.string().trim().uuid('Subject must be a valid identifier'),
  taskId: z.string().trim().uuid('Task must be a valid identifier').optional(),
  durationMinutes: z
    .number({ invalid_type_error: 'Duration must be a whole number of minutes' })
    .int('Duration must be a whole number of minutes')
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 1,440 minutes')
})

export type CreateStudySessionInput = z.infer<typeof CreateStudySessionSchema>

export const UpdateStudySessionSchema = z
  .object({
    subjectId: z.string().trim().uuid('Subject must be a valid identifier').optional(),
    taskId: z.string().trim().uuid('Task must be a valid identifier').nullable().optional(),
    durationMinutes: z
      .number({ invalid_type_error: 'Duration must be a whole number of minutes' })
      .int('Duration must be a whole number of minutes')
      .min(1, 'Duration must be at least 1 minute')
      .max(1440, 'Duration cannot exceed 1,440 minutes')
      .optional()
  })
  .refine(
    (value) => value.subjectId !== undefined || value.taskId !== undefined || value.durationMinutes !== undefined,
    { message: 'At least one session field must be provided' }
  )

export type UpdateStudySessionInput = z.infer<typeof UpdateStudySessionSchema>
