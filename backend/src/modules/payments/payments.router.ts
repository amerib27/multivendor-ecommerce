import { Router } from 'express'
import { createPaymentIntent, stripeWebhook, getPaymentStatus } from './payments.controller'
import { authenticate } from '../../middleware/auth.middleware'

const router = Router()

// Stripe webhook — raw body, no auth (handled in app.ts before express.json)
router.post('/webhook', stripeWebhook)

// Protected
router.post('/create-intent', authenticate, createPaymentIntent)
router.get('/status/:orderId', authenticate, getPaymentStatus)

export default router
