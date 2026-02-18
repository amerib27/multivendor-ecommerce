import app from './app'
import { config } from './config'
import { prisma } from './config/database'

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    app.listen(config.port, () => {
      console.log('')
      console.log('─────────────────────────────────────────────')
      console.log(`  🚀 Server running on http://localhost:${config.port}`)
      console.log(`  🌍 Environment: ${config.nodeEnv}`)
      console.log(`  🔗 Frontend URL: ${config.frontendUrl}`)
      console.log('─────────────────────────────────────────────')
      console.log('')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
