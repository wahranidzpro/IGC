export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: PaginationMeta
  timestamp: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedParams {
  page?: number
  pageSize?: number
  sort?: string
  order?: "asc" | "desc"
  search?: string
  filters?: Record<string, string | string[]>
}

export interface ApiQueryParams extends PaginatedParams {
  fields?: string
  includes?: string[]
  from?: string
  to?: string
}

export const API_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  SUPABASE_ERROR: "SUPABASE_ERROR",
} as const

export function successResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return { success: true, data, meta, timestamp: new Date().toISOString() }
}

export function errorResponse(code: string, message: string, details?: unknown): ApiResponse<never> {
  return { success: false, error: { code, message, details }, timestamp: new Date().toISOString() }
}
