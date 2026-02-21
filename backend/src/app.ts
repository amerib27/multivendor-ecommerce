import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import { errorHandler } from './middleware/error.middleware'

// Routers
import authRouter from './modules/auth/auth.router'
import usersRouter from './modules/users/users.router'
import vendorsRouter from './modules/vendors/vendors.router'
import productsRouter from './modules/products/products.router'
import categoriesRouter from './modules/categories/categories.router'
import cartRouter from './modules/cart/cart.router'
import ordersRouter from './modules/orders/orders.router'
import paymentsRouter from './modules/payments/payments.router'
import reviewsRouter from './modules/reviews/reviews.router'
import wishlistRouter from './modules/wishlist/wishlist.router'
import notificationsRouter from './modules/notifications/notifications.router'
import adminRouter from './modules/admin/admin.router'

const app = express()

// ─── Trust Proxy (for Render/Heroku/etc) ─────────────────────────────────────
app.set('trust proxy', 1)

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
    },
  },
}))

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(compression())

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
})

app.use(globalLimiter)

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// IMPORTANT: Raw body for Stripe webhook MUST come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ─── Logging ─────────────────────────────────────────────────────────────────
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0',
  })
})

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter)
app.use('/api/users', usersRouter)
app.use('/api/vendors', vendorsRouter)
app.use('/api/products', productsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/cart', cartRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/wishlist', wishlistRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/admin', adminRouter)

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ─── Error Handler (must be last) ────────────────────────────────────────────
app.use(errorHandler)

export default app
