import { Request, Response, NextFunction } from 'express'
import { AdminService } from './admin.service'
import { AnalyticsService } from './analytics.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import { buildPaginationMeta } from '../../utils/pagination.utils'

const adminService = new AdminService()
const analyticsService = new AnalyticsService()

// ─── Analytics ─────────────────────────────────────────────────────────────
export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getPlatformStats()
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export const getRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query['period'] as 'week' | 'month' | 'year') || 'month'
    const data = await analyticsService.getRevenueByPeriod(period)
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export const getTopProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getTopProducts()
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export const getTopVendors = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getTopVendors()
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export const getRecentOrders = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getRecentOrders()
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

// ─── Users ─────────────────────────────────────────────────────────────────
export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const search = req.query['search'] as string | undefined

    const { data, total } = await adminService.listUsers(page, limit, search)
    sendSuccess(res, data, 'Success', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

export const toggleUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.toggleUser(req.params['id'] as string)
    sendSuccess(res, { id: result.id, isActive: result.isActive }, result.message)
  } catch (err: any) {
    if (err.message === 'User not found') {
      sendError(res, err.message, 404)
      return
    }
    next(err)
  }
}

// ─── Vendors ───────────────────────────────────────────────────────────────
export const listVendors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const status = req.query['status'] as string | undefined

    const { data, total } = await adminService.listVendors(page, limit, status)
    sendSuccess(res, data, 'Success', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

export const approveVendor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await adminService.approveVendor(req.params['id'] as string)
    sendSuccess(res, updated, 'Vendor approved')
  } catch (err: any) {
    if (err.message === 'Vendor not found') {
      sendError(res, err.message, 404)
      return
    }
    next(err)
  }
}

export const rejectVendor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body
    const updated = await adminService.rejectVendor(req.params['id'] as string, reason)
    sendSuccess(res, updated, 'Vendor rejected')
  } catch (err: any) {
    if (err.message === 'Vendor not found') {
      sendError(res, err.message, 404)
      return
    }
    next(err)
  }
}

export const suspendVendor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await adminService.suspendVendor(req.params['id'] as string)
    sendSuccess(res, updated, 'Vendor suspended')
  } catch (err) {
    next(err)
  }
}

// ─── Products ──────────────────────────────────────────────────────────────
export const listProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20

    const { data, total } = await adminService.listProducts(page, limit)
    sendSuccess(res, data, 'Success', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

export const toggleProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.toggleProduct(req.params['id'] as string)
    sendSuccess(res, { id: result.id, isActive: result.isActive }, result.message)
  } catch (err: any) {
    if (err.message === 'Product not found') {
      sendError(res, err.message, 404)
      return
    }
    next(err)
  }
}

export const toggleProductFeatured = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.toggleProductFeatured(req.params['id'] as string)
    sendSuccess(res, { id: result.id, isFeatured: result.isFeatured })
  } catch (err: any) {
    if (err.message === 'Product not found') {
      sendError(res, err.message, 404)
      return
    }
    next(err)
  }
}

// ─── Orders ────────────────────────────────────────────────────────────────
export const listOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const status = req.query['status'] as string | undefined

    const { data, total } = await adminService.listOrders(page, limit, status)
    sendSuccess(res, data, 'Success', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

export const resyncOrderStatuses = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { synced } = await adminService.resyncOrderStatuses()
    sendSuccess(res, { synced }, `Synced ${synced} order statuses`)
  } catch (err) {
    next(err)
  }
}
