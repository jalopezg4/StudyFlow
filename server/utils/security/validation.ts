import { z, type ZodType } from 'zod'
import { createSafeHttpError } from './errors'

type ValidationSource = 'body' | 'query' | 'params'

export function validateWithSchema<T>(
  schema: ZodType<T>,
  input: unknown,
  source: ValidationSource
): T {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    throw createSafeHttpError(422, 'VALIDATION_ERROR', 'Invalid request input', {
      source,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    })
  }

  return parsed.data
}

export const nonEmptyString = z.string().trim().min(1)
