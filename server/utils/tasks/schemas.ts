import { z } from 'zod'
import { createSafeHttpError } from '../security/errors'

export const TaskIdParamSchema = z.object({
  id: z.string().trim().uuid()
})

export function parseTaskId(rawParams: unknown): string {
  const parsed = TaskIdParamSchema.safeParse(rawParams)

  if (!parsed.success) {
    // Malformed/missing ids are treated identically to "not found" so a
    // caller can never distinguish a bad id from one owned by someone else.
    throw createSafeHttpError(404, 'NOT_FOUND', 'Study task not found')
  }

  return parsed.data.id
}

function isValidCalendarDate(value: string): boolean {
  const parts = value.split('-').map(Number)
  const [year, month, day] = parts

  if (year === undefined || month === undefined || day === undefined) {
    return false
  }

  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

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
    .refine((value) => value === undefined || isValidCalendarDate(value), {
      message: 'Due date must be a valid date'
    })
})

export type CreateStudyTaskInput = z.infer<typeof CreateStudyTaskSchema>

export const UpdateStudyTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(100, 'Title must be at most 100 characters')
      .optional(),
    // An omitted key leaves the field untouched; an explicit empty string
    // clears it to null. Distinguishing the two requires not collapsing
    // both cases to `undefined` the way the create schema does.
    description: z
      .string()
      .trim()
      .max(500, 'Description must be at most 500 characters')
      .optional()
      .transform((value) => (value === undefined ? undefined : value.length > 0 ? value : null)),
    dueDate: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value === undefined ? undefined : value.length > 0 ? value : null))
      .refine((value) => value === undefined || value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: 'Due date must be in YYYY-MM-DD format'
      })
      .refine((value) => value === undefined || value === null || isValidCalendarDate(value), {
        message: 'Due date must be a valid date'
      }),
    status: z.enum(['pending', 'completed']).optional()
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.dueDate !== undefined ||
      value.status !== undefined,
    { message: 'At least one of title, description, dueDate, or status must be provided' }
  )

export type UpdateStudyTaskInput = z.infer<typeof UpdateStudyTaskSchema>
