import { Router } from 'express'
import { register, login, refresh, logout, me } from './auth.controller'
import { authenticate } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { registerSchema, loginSchema, refreshSchema } from './auth.schema'

const router = Router()

// Public routes
router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', validate(refreshSchema), refresh)

// Protected routes
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, me)

export default router
