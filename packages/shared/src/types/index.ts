/** Branded CUID string type */
export type CuidString = string & { readonly __brand: 'CuidString' }

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: Record<string, unknown>
}

export type SortOrder = 'asc' | 'desc'

export interface DateRange {
  from: Date
  to: Date
}
