import { Response, NextFunction } from 'express'
import { UsersService } from './users.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import type { AuthRequest } from '../../middleware/auth.middleware'

const usersService = new UsersService()

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await usersService.getProfile(req.user!.userId)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await usersService.updateProfile(req.user!.userId, req.body)
    sendSuccess(res, data, 'Profile updated')
  } catch (err) { next(err) }
}

export const updateAvatar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) { sendError(res, 'No image uploaded', 400); return }
    const file = req.file as Express.Multer.File & { path: string }
    const data = await usersService.updateAvatar(req.user!.userId, file.path)
    sendSuccess(res, data, 'Avatar updated')
  } catch (err) { next(err) }
}

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await usersService.changePassword(req.user!.userId, req.body)
    sendSuccess(res, null, 'Password changed successfully')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
}

export const getAddresses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await usersService.getAddresses(req.user!.userId)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

export const createAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await usersService.createAddress(req.user!.userId, req.body)
    sendSuccess(res, data, 'Address created', 201)
  } catch (err) { next(err) }
}

export const updateAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await usersService.updateAddress(req.user!.userId, req.params['id'] as string, req.body)
    sendSuccess(res, data, 'Address updated')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const deleteAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await usersService.deleteAddress(req.user!.userId, req.params['id'] as string)
    sendSuccess(res, null, 'Address deleted')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const setDefaultAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await usersService.setDefaultAddress(req.user!.userId, req.params['id'] as string)
    sendSuccess(res, data, 'Default address updated')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}
