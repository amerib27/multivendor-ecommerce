import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { Role } from '@prisma/client'
import * as adminController from './admin.controller'
import { rejectVendorSchema } from './admin.schema'

const router = Router()

router.use(authenticate, requireRole(Role.ADMIN))

// ─── Analytics ─────────────────────────────────────────────────────────────
router.get('/stats', adminController.getStats)
router.get('/analytics/revenue', adminController.getRevenue)
router.get('/analytics/top-products', adminController.getTopProducts)
router.get('/analytics/top-vendors', adminController.getTopVendors)
router.get('/analytics/recent-orders', adminController.getRecentOrders)

// ─── Users ─────────────────────────────────────────────────────────────────
router.get('/users', adminController.listUsers)
router.patch('/users/:id/toggle', adminController.toggleUser)

// ─── Vendors ───────────────────────────────────────────────────────────────
router.get('/vendors', adminController.listVendors)
router.patch('/vendors/:id/approve', adminController.approveVendor)
router.patch('/vendors/:id/reject', validate(rejectVendorSchema), adminController.rejectVendor)
router.patch('/vendors/:id/suspend', adminController.suspendVendor)

// ─── Products ──────────────────────────────────────────────────────────────
router.get('/products', adminController.listProducts)
router.patch('/products/:id/toggle', adminController.toggleProduct)
router.patch('/products/:id/featured', adminController.toggleProductFeatured)

// ─── Orders ────────────────────────────────────────────────────────────────
router.get('/orders', adminController.listOrders)
router.post('/orders/resync-statuses', adminController.resyncOrderStatuses)

export default router
