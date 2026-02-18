import { Request, Response, NextFunction } from 'express'
import { VendorsService } from './vendors.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import type { AuthRequest } from '../../middleware/auth.middleware'

const vendorsService = new VendorsService()

export const applyVendor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await vendorsService.apply(req.user!.userId, req.body)
    sendSuccess(res, data, 'Vendor application submitted. Awaiting approval.', 201)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
}

export const getVendorProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await vendorsService.getVendorProfile(req.user!.userId)
    sendSuccess(res, data)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const updateVendorProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await vendorsService.updateVendorProfile(req.user!.userId, req.body)
    sendSuccess(res, data, 'Vendor profile updated')
  } catch (err) { next(err) }
}

export const updateVendorLogo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) { sendError(res, 'No image uploaded', 400); return }
    const file = req.file as Express.Multer.File & { path: string }
    const data = await vendorsService.updateLogo(req.user!.userId, file.path)
    sendSuccess(res, data, 'Logo updated')
  } catch (err) { next(err) }
}

export const updateVendorBanner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) { sendError(res, 'No image uploaded', 400); return }
    const file = req.file as Express.Multer.File & { path: string }
    const data = await vendorsService.updateBanner(req.user!.userId, file.path)
    sendSuccess(res, data, 'Banner updated')
  } catch (err) { next(err) }
}

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await vendorsService.getDashboardStats(req.user!.userId)
    sendSuccess(res, data)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const getDashboardAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await vendorsService.getDashboardAnalytics(req.user!.userId)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

export const getPublicVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await vendorsService.getPublicVendor(req.params['slug'] as string)
    sendSuccess(res, data)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const getVendorPublicProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1)
    const limit = Math.min(100, parseInt(req.query['limit'] as string) || 20)
    const { products, meta } = await vendorsService.getVendorProducts(req.params['slug'] as string, page, limit)
    sendSuccess(res, products, 'Success', 200, meta)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}
