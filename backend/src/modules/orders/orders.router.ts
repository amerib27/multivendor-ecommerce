import { Router } from 'express'
import {
  createOrder, getUserOrders, getOrderDetail, cancelOrder,
  getVendorOrders, updateVendorOrderItemStatus,
} from './orders.controller'
import { authenticate, requireRole } from '../../middleware/auth.middleware'
import { Role } from '@prisma/client'

const router = Router()

router.use(authenticate)

// Customer routes (static routes BEFORE /:id)
router.post('/', createOrder)
router.get('/', getUserOrders)

// Vendor routes (static routes BEFORE /:id)
router.get('/vendor/incoming', requireRole(Role.VENDOR, Role.ADMIN), getVendorOrders)
router.patch('/vendor/items/:itemId/status', requireRole(Role.VENDOR, Role.ADMIN), updateVendorOrderItemStatus)

// Param routes (AFTER static routes)
router.get('/:id', getOrderDetail)
router.patch('/:id/cancel', cancelOrder)

export default router
