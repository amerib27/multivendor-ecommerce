import { Router } from 'express'
import {
  applyVendor, getVendorProfile, updateVendorProfile,
  updateVendorLogo, updateVendorBanner,
  getPublicVendor, getVendorPublicProducts,
  getDashboardStats, getDashboardAnalytics,
} from './vendors.controller'
import { authenticate, requireRole } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { uploadVendorLogo, uploadVendorBanner } from '../../middleware/upload.middleware'
import { applyVendorSchema, updateVendorSchema } from './vendors.schema'
import { Role } from '@prisma/client'
import { prisma } from '../../config/database'
import { sendSuccess } from '../../utils/apiResponse.utils'
import { Request, Response, NextFunction } from 'express'

const router = Router()

// Public — top active vendors by order count (static routes BEFORE /:slug)
router.get('/top', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        storeName: true,
        storeSlug: true,
        logoUrl: true,
        _count: { select: { products: true } },
        orderItems: { select: { id: true } },
      },
      take: 8,
    })
    const result = vendors
      .map(v => ({ ...v, totalOrders: v.orderItems.length, orderItems: undefined }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 4)
    sendSuccess(res, result)
  } catch (err) { next(err) }
})

// Protected — any authenticated user can apply (static routes BEFORE /:slug)
router.post('/apply', authenticate, validate(applyVendorSchema), applyVendor)

// Vendor-only dashboard routes (static routes BEFORE /:slug)
router.get('/dashboard/profile', authenticate, requireRole(Role.VENDOR, Role.ADMIN), getVendorProfile)
router.put('/dashboard/profile', authenticate, requireRole(Role.VENDOR, Role.ADMIN), validate(updateVendorSchema), updateVendorProfile)
router.post('/dashboard/logo', authenticate, requireRole(Role.VENDOR, Role.ADMIN), uploadVendorLogo.single('logo'), updateVendorLogo)
router.post('/dashboard/banner', authenticate, requireRole(Role.VENDOR, Role.ADMIN), uploadVendorBanner.single('banner'), updateVendorBanner)
router.get('/dashboard/stats', authenticate, requireRole(Role.VENDOR, Role.ADMIN), getDashboardStats)
router.get('/dashboard/analytics', authenticate, requireRole(Role.VENDOR, Role.ADMIN), getDashboardAnalytics)

// Public slug routes (AFTER static routes to prevent conflicts)
router.get('/:slug', getPublicVendor)
router.get('/:slug/products', getVendorPublicProducts)

export default router
