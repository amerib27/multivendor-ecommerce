import { Router } from 'express'
import { prisma } from '../../config/database'
import { AnalyticsService } from './analytics.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import { authenticate, requireRole } from '../../middleware/auth.middleware'
import { buildPaginationMeta } from '../../utils/pagination.utils'
import { sendVendorApprovalEmail, sendVendorRejectionEmail } from '../../utils/email.utils'
import type { AuthRequest } from '../../middleware/auth.middleware'
import { Request, Response, NextFunction } from 'express'
import { Role, OrderStatus } from '@prisma/client'

const analyticsService = new AnalyticsService()
const router = Router()

router.use(authenticate, requireRole(Role.ADMIN))

// ─── Analytics ───────────────────────────────────────────────────────────────

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getPlatformStats()
    sendSuccess(res, data)
  } catch (err) { next(err) }
})

router.get('/analytics/revenue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query['period'] as 'week' | 'month' | 'year') || 'month'
    const data = await analyticsService.getRevenueByPeriod(period)
    sendSuccess(res, data)
  } catch (err) { next(err) }
})

router.get('/analytics/top-products', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getTopProducts()
    sendSuccess(res, data)
  } catch (err) { next(err) }
})

router.get('/analytics/top-vendors', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getTopVendors()
    sendSuccess(res, data)
  } catch (err) { next(err) }
})

router.get('/analytics/recent-orders', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getRecentOrders()
    sendSuccess(res, data)
  } catch (err) { next(err) }
})

// ─── Users ────────────────────────────────────────────────────────────────────

router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const search = req.query['search'] as string | undefined

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, isEmailVerified: true, createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ])
    sendSuccess(res, users, 'Success', 200, buildPaginationMeta(total, page, limit))
  } catch (err) { next(err) }
})

router.patch('/users/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params['id'] as string } })
    if (!user) { sendError(res, 'User not found', 404); return }
    const updated = await prisma.user.update({
      where: { id: req.params['id'] as string },
      data: { isActive: !user.isActive },
    })
    sendSuccess(res, { id: updated.id, isActive: updated.isActive }, `User ${updated.isActive ? 'activated' : 'deactivated'}`)
  } catch (err) { next(err) }
})

// ─── Vendors ──────────────────────────────────────────────────────────────────

router.get('/vendors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const status = req.query['status'] as string | undefined

    const where = status ? { status: status as any } : {}
    const [total, vendors] = await Promise.all([
      prisma.vendor.count({ where }),
      prisma.vendor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          _count: { select: { products: true, orderItems: true } },
        },
      }),
    ])
    sendSuccess(res, vendors, 'Success', 200, buildPaginationMeta(total, page, limit))
  } catch (err) { next(err) }
})

router.patch('/vendors/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params['id'] as string }, include: { user: true } })
    if (!vendor) { sendError(res, 'Vendor not found', 404); return }
    const updated = await prisma.vendor.update({ where: { id: req.params['id'] as string }, data: { status: 'ACTIVE' } })
    sendVendorApprovalEmail(vendor.user.email, { storeName: vendor.storeName, firstName: vendor.user.firstName }).catch(console.error)
    await prisma.notification.create({
      data: {
        userId: vendor.userId,
        type: 'VENDOR_APPROVED',
        title: 'Store Approved!',
        message: `Your store "${vendor.storeName}" has been approved.`,
      },
    })
    sendSuccess(res, updated, 'Vendor approved')
  } catch (err) { next(err) }
})

router.patch('/vendors/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params['id'] as string }, include: { user: true } })
    if (!vendor) { sendError(res, 'Vendor not found', 404); return }
    const updated = await prisma.vendor.update({ where: { id: req.params['id'] as string }, data: { status: 'REJECTED' } })
    sendVendorRejectionEmail(vendor.user.email, { storeName: vendor.storeName, firstName: vendor.user.firstName, reason }).catch(console.error)
    await prisma.notification.create({
      data: {
        userId: vendor.userId,
        type: 'VENDOR_REJECTED',
        title: 'Application Update',
        message: `Your store "${vendor.storeName}" application was not approved.`,
      },
    })
    sendSuccess(res, updated, 'Vendor rejected')
  } catch (err) { next(err) }
})

router.patch('/vendors/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await prisma.vendor.update({ where: { id: req.params['id'] as string }, data: { status: 'SUSPENDED' } })
    sendSuccess(res, updated, 'Vendor suspended')
  } catch (err) { next(err) }
})

// ─── Products ─────────────────────────────────────────────────────────────────

router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const [total, products] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          vendor: { select: { storeName: true } },
          _count: { select: { reviews: true, orderItems: true } },
        },
      }),
    ])
    sendSuccess(res, products, 'Success', 200, buildPaginationMeta(total, page, limit))
  } catch (err) { next(err) }
})

router.patch('/products/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params['id'] as string } })
    if (!product) { sendError(res, 'Product not found', 404); return }
    const updated = await prisma.product.update({
      where: { id: req.params['id'] as string },
      data: { isActive: !product.isActive },
    })
    sendSuccess(res, { id: updated.id, isActive: updated.isActive }, `Product ${updated.isActive ? 'activated' : 'deactivated'}`)
  } catch (err) { next(err) }
})

router.patch('/products/:id/featured', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params['id'] as string } })
    if (!product) { sendError(res, 'Product not found', 404); return }
    const updated = await prisma.product.update({
      where: { id: req.params['id'] as string },
      data: { isFeatured: !product.isFeatured },
    })
    sendSuccess(res, { id: updated.id, isFeatured: updated.isFeatured })
  } catch (err) { next(err) }
})

// ─── Orders ───────────────────────────────────────────────────────────────────

router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const status = req.query['status'] as string | undefined

    const where = status ? { status: status as any } : {}
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          payment: { select: { status: true, method: true } },
          _count: { select: { items: true } },
        },
      }),
    ])
    sendSuccess(res, orders, 'Success', 200, buildPaginationMeta(total, page, limit))
  } catch (err) { next(err) }
})

// Resync all Order.status values from their OrderItem statuses (fixes stuck orders)
router.post('/orders/resync-statuses', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { notIn: [OrderStatus.CANCELLED] } },
      include: { items: { select: { status: true } } },
    })
    const STATUS_RANK: Record<string, number> = { PENDING: 0, CONFIRMED: 1, PROCESSING: 2, SHIPPED: 3, DELIVERED: 4 }
    let synced = 0
    for (const order of orders) {
      if (!order.items.length) continue
      const lowestStatus = order.items.map(i => i.status).reduce((min, s) =>
        (STATUS_RANK[s] ?? 0) < (STATUS_RANK[min] ?? 0) ? s : min
      )
      if (order.status !== lowestStatus) {
        await prisma.order.update({ where: { id: order.id }, data: { status: lowestStatus as any } })
        synced++
      }
    }
    sendSuccess(res, { synced }, `Synced ${synced} order statuses`)
  } catch (err) { next(err) }
})

export default router
