import { Router } from 'express'
import { listCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory } from './categories.controller'
import { authenticate, requireRole } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { createCategorySchema, updateCategorySchema } from './categories.schema'
import { Role } from '@prisma/client'

const router = Router()

// Public
router.get('/', listCategories)
router.get('/:slug', getCategoryBySlug)

// Admin only
router.post('/', authenticate, requireRole(Role.ADMIN), validate(createCategorySchema), createCategory)
router.put('/:id', authenticate, requireRole(Role.ADMIN), validate(updateCategorySchema), updateCategory)
router.delete('/:id', authenticate, requireRole(Role.ADMIN), deleteCategory)

export default router
