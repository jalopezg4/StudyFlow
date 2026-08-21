import { z } from 'zod'

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
