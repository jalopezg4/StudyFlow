import { z } from 'zod'
import { nonEmptyString } from './validation'

export const ownedResourceParamsSchema = z.object({
  resourceId: z.string().trim().min(1).max(100)
})

export const ownedResourceQuerySchema = z.object({
  ownerId: nonEmptyString,
  includeMeta: z
    .preprocess((value) => {
      if (value === 'true') {
        return true
      }

      if (value === 'false') {
        return false
      }

      return value
    }, z.boolean())
    .optional()
})

export const ownedResourceBodySchema = z.object({
  ownerId: nonEmptyString,
  title: z.string().trim().min(1).max(120)
})
