import { z } from 'zod'
import { createSafeHttpError } from '../security/errors'

export const SubjectIdParamSchema = z.object({
  id: z.string().trim().min(1)
})

export function parseSubjectId(rawParams: unknown): string {
  const parsed = SubjectIdParamSchema.safeParse(rawParams)

  if (!parsed.success) {
    // Malformed/missing ids are treated identically to "not found" so a
    // caller can never distinguish a bad id from one owned by someone else.
    throw createSafeHttpError(404, 'NOT_FOUND', 'Subject not found')
  }

  return parsed.data.id
}

export const CreateSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
})

export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>

export const UpdateSubjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be at most 500 characters')
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined))
  })
  .refine((value) => value.name !== undefined || value.description !== undefined, {
    message: 'At least one of name or description must be provided'
  })

export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>
