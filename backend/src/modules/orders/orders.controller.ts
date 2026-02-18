import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { OrdersService } from './orders.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import type { AuthRequest } from '../../middleware/auth.middleware'
import { prisma } from '../../config/database'

const ordersService = new OrdersService()

const createOrderSchema = z.object({
  addressId: z.string().min(1, 'Address is required'),
  notes: z.string().max(500).optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1, 'Cart is empty'),
})

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createOrderSchema.safeParse(req.body)
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message || 'Validation error', 400)
      return
    }
    const order = await ordersService.createOrderFromCart(
      req.user!.userId,
      parsed.data.addressId,
      parsed.data.items,
      parsed.data.notes
    )
    sendSuccess(res, order, 'Order created', 201)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
}

export const getUserOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 10
    const status = req.query['status'] as string | undefined
    const { orders, meta } = await ordersService.getUserOrders(req.user!.userId, page, limit, status)
    sendSuccess(res, orders, 'Success', 200, meta)
  } catch (err) { next(err) }
}

export const getOrderDetail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await ordersService.getOrderDetail(req.params['id'] as string, req.user!.userId)
    sendSuccess(res, order)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await ordersService.cancelOrder(req.params['id'] as string, req.user!.userId)
    sendSuccess(res, order, 'Order cancelled')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
}

export const getVendorOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } })
    if (!vendor) { sendError(res, 'Vendor not found', 404); return }
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const status = req.query['status'] as string | undefined
    const { items, meta } = await ordersService.getVendorOrders(vendor.id, page, limit, status)
    sendSuccess(res, items, 'Success', 200, meta)
  } catch (err) { next(err) }
}

export const updateVendorOrderItemStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } })
    if (!vendor) { sendError(res, 'Vendor not found', 404); return }
    const { status } = req.body
    if (!status) { sendError(res, 'status is required', 400); return }
    const item = await ordersService.updateOrderItemStatus(req.params['itemId'] as string, vendor.id, status)
    sendSuccess(res, item, 'Order status updated')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
}
