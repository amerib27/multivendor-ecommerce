import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JwtPayload } from '../utils/jwt.utils'
import { sendError } from '../utils/apiResponse.utils'
import { Role } from '@prisma/client'

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Access token required', 401)
    return
  }
  const token = authHeader.split(' ')[1]
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    sendError(res, 'Invalid or expired access token', 401)
  }
}

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401)
      return
    }
    if (!roles.includes(req.user.role as Role)) {
      sendError(res, 'Forbidden: insufficient permissions', 403)
      return
    }
    next()
  }
}

// Optional authentication — attaches user if token present, but doesn't block if absent
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      req.user = verifyAccessToken(token)
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }
  next()
}
