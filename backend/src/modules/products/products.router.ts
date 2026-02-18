import { Router } from 'express'
import {
  listProducts, getFeaturedProducts, getProductBySlug,
  getMyProducts, createProduct, updateProduct, deleteProduct,
  uploadProductImages, deleteProductImage, setPrimaryImage,
} from './products.controller'
import { authenticate, requireRole } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { uploadProductImages as uploadMiddleware } from '../../middleware/upload.middleware'
import { createProductSchema, updateProductSchema, productQuerySchema } from './products.schema'
import { Role } from '@prisma/client'

const router = Router()

// Public (static routes BEFORE /:slug)
router.get('/', validate(productQuerySchema), listProducts)
router.get('/featured', getFeaturedProducts)

// Vendor-only (static routes BEFORE /:slug)
router.get('/vendor/mine', authenticate, requireRole(Role.VENDOR, Role.ADMIN), getMyProducts)
router.post('/', authenticate, requireRole(Role.VENDOR, Role.ADMIN), validate(createProductSchema), createProduct)

// Param routes (AFTER static routes)
router.get('/:slug', getProductBySlug)
router.put('/:id', authenticate, requireRole(Role.VENDOR, Role.ADMIN), validate(updateProductSchema), updateProduct)
router.delete('/:id', authenticate, requireRole(Role.VENDOR, Role.ADMIN), deleteProduct)

// Image management
router.post('/:id/images', authenticate, requireRole(Role.VENDOR, Role.ADMIN), uploadMiddleware.array('images', 5), uploadProductImages)
router.delete('/:id/images/:imageId', authenticate, requireRole(Role.VENDOR, Role.ADMIN), deleteProductImage)
router.patch('/:id/images/:imageId/primary', authenticate, requireRole(Role.VENDOR, Role.ADMIN), setPrimaryImage)

export default router
