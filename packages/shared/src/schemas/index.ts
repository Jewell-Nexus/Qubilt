import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export type PaginationInput = z.infer<typeof paginationSchema>

export const cuidSchema = z.string().cuid()

export const dateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
})

export type DateRangeInput = z.infer<typeof dateRangeSchema>
