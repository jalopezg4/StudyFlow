import { z } from 'zod'

export const CreateStudyTaskSchema = z.object({
  subjectId: z.string().trim().uuid('Subject must be a valid identifier'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  dueDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine((value) => value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'Due date must be in YYYY-MM-DD format'
    })
    .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), {
      message: 'Due date must be a valid date'
    })
})

export type CreateStudyTaskInput = z.infer<typeof CreateStudyTaskSchema>
