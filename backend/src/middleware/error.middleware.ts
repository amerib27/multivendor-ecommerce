import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message)

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
    return
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({ success: false, message: 'Resource already exists (duplicate)' })
        return
      case 'P2025':
        res.status(404).json({ success: false, message: 'Resource not found' })
        return
      case 'P2003':
        res.status(400).json({ success: false, message: 'Invalid reference to related resource' })
        return
      default:
        res.status(400).json({ success: false, message: `Database error: ${err.code}` })
        return
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, message: 'Invalid data provided' })
    return
  }

  // Multer errors
  if (err.name === 'MulterError') {
    res.status(400).json({ success: false, message: err.message })
    return
  }

  // Generic errors
  const statusCode = (err as { statusCode?: number }).statusCode || 500
  const message = statusCode === 500 ? 'Internal server error' : err.message

  res.status(statusCode).json({ success: false, message })
}
