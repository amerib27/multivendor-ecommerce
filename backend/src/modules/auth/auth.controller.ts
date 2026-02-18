import { Request, Response, NextFunction } from 'express'
import { AuthService } from './auth.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import type { AuthRequest } from '../../middleware/auth.middleware'

const authService = new AuthService()

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.register(req.body)
    sendSuccess(res, result, 'Registration successful', 201)
  } catch (err) {
    if (err instanceof Error) {
      sendError(res, err.message, 400)
    } else {
      next(err)
    }
  }
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.body)
    sendSuccess(res, result, 'Login successful')
  } catch (err) {
    if (err instanceof Error) {
      sendError(res, err.message, 401)
    } else {
      next(err)
    }
  }
}

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body
    const result = await authService.refresh(refreshToken)
    sendSuccess(res, result, 'Token refreshed successfully')
  } catch (err) {
    if (err instanceof Error) {
      sendError(res, err.message, 401)
    } else {
      next(err)
    }
  }
}

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logout(req.user!.userId)
    sendSuccess(res, null, 'Logged out successfully')
  } catch (err) {
    next(err)
  }
}

export const me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.userId)
    sendSuccess(res, user)
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found') {
      sendError(res, 'User not found', 404)
    } else {
      next(err)
    }
  }
}
