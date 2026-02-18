import Stripe from 'stripe'
import { prisma } from '../../config/database'
import { config } from '../../config'

const stripe = new Stripe(config.stripe.secretKey || 'sk_test_placeholder')

export class PaymentsService {
  async createPaymentIntent(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, status: 'PENDING' },
    })
    if (!order) throw new Error('Order not found or already paid')

    // Check if payment intent already exists
    const existingPayment = await prisma.payment.findUnique({ where: { orderId } })
    if (existingPayment?.stripePaymentIntentId && existingPayment.status === 'PENDING') {
      // Return existing intent (idempotent)
      const intent = await stripe.paymentIntents.retrieve(existingPayment.stripePaymentIntentId)
      return { clientSecret: intent.client_secret, paymentIntentId: intent.id }
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalAmount) * 100), // cents
      currency: 'usd',
      metadata: { orderId, userId },
      automatic_payment_methods: { enabled: true },
    })

    await prisma.payment.upsert({
      where: { orderId },
      update: { stripePaymentIntentId: intent.id },
      create: {
        orderId,
        amount: order.totalAmount,
        stripePaymentIntentId: intent.id,
        status: 'PENDING',
      },
    })

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret)
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${(err as Error).message}`)
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.update({
            where: { stripePaymentIntentId: intent.id },
            data: {
              status: 'PAID',
              stripeChargeId: intent.latest_charge as string | null,
              receiptUrl: null,
            },
          })

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: 'CONFIRMED' },
          })

          // Confirm all order items so vendors can act on them
          await tx.orderItem.updateMany({
            where: { orderId: payment.orderId },
            data: { status: 'CONFIRMED' },
          })

          // Update vendor stats
          const orderItems = await tx.orderItem.findMany({ where: { orderId: payment.orderId } })
          for (const item of orderItems) {
            await tx.vendor.update({
              where: { id: item.vendorId },
              data: {
                totalRevenue: { increment: Number(item.vendorPayout) },
                totalOrders: { increment: 1 },
              },
            })
          }

          // Notify user
          const order = await tx.order.findUnique({ where: { id: payment.orderId } })
          if (order) {
            await tx.notification.create({
              data: {
                userId: order.userId,
                type: 'PAYMENT_SUCCESS',
                title: 'Payment Successful',
                message: `Payment for order ${order.orderNumber} was successful.`,
                metadata: { orderId: order.id },
              },
            })
          }
        })
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        await prisma.payment.update({
          where: { stripePaymentIntentId: intent.id },
          data: {
            status: 'FAILED',
            failureReason: intent.last_payment_error?.message,
          },
        })
        break
      }
    }

    return { received: true }
  }

  async getPaymentStatus(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } })
    if (!order) throw new Error('Order not found')

    const payment = await prisma.payment.findUnique({ where: { orderId } })
    return { order, payment }
  }
}
