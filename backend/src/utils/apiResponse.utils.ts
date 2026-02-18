import { Response } from 'express'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: unknown
  meta?: PaginationMeta
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta
): void => {
  const body: ApiResponse<T> = { success: true, message, data }
  if (meta) body.meta = meta
  res.status(statusCode).json(body)
}

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: unknown
): void => {
  const body: ApiResponse = { success: false, message }
  if (errors !== undefined) body.errors = errors
  res.status(statusCode).json(body)
}
