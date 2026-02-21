import { OrderStatus } from '@prisma/client'
import { prisma } from '../../config/database'
import { buildPaginationMeta } from '../../utils/pagination.utils'
import { sendOrderConfirmationEmail } from '../../utils/email.utils'

export class OrdersService {
  async createOrderFromCart(
    userId: string,
    addressId: string,
    cartItems: Array<{ productId: string; quantity: number }>,
    notes?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify address belongs to user
      const address = await tx.address.findFirst({ where: { id: addressId, userId } })
      if (!address) throw new Error('Shipping address not found')

      // 2. Fetch products for the provided cart items
      const products = await tx.product.findMany({
        where: { id: { in: cartItems.map(i => i.productId) } },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          vendor: { select: { id: true, commissionRate: true, status: true } },
        },
      })

      // Build enriched items list
      const items = cartItems.map(ci => {
        const product = products.find(p => p.id === ci.productId)
        if (!product) throw new Error('One or more products not found')
        return { productId: ci.productId, quantity: ci.quantity, product }
      })

      // 3. Validate each item
      for (const item of items) {
        if (!item.product.isActive) {
          throw new Error(`"${item.product.name}" is no longer available`)
        }
        if (item.product.vendor.status !== 'ACTIVE') {
          throw new Error(`"${item.product.name}" vendor is currently unavailable`)
        }
        if (item.product.stock < item.quantity) {
          throw new Error(`Only ${item.product.stock} units of "${item.product.name}" available`)
        }
      }

      // 4. Calculate totals
      const subtotal = items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      )
      const totalAmount = subtotal // Could add tax/shipping here

      // 5. Generate unique order number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
      const orderNumber = `ORD-${dateStr}-${rand}`

      // 6. Create order with items
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          subtotal,
          totalAmount,
          notes,
          items: {
            create: items.map(item => {
              const commission = Number(item.product.vendor.commissionRate) / 100
              const itemTotal = Number(item.product.price) * item.quantity
              const vendorPayout = itemTotal * (1 - commission)
              return {
                productId: item.productId,
                vendorId: item.product.vendor.id,
                productName: item.product.name,
                productImage: item.product.images[0]?.url || null,
                quantity: item.quantity,
                unitPrice: item.product.price,
                totalPrice: itemTotal,
                vendorPayout,
              }
            }),
          },
        },
        include: {
          items: true,
          address: true,
        },
      })

      // 7. Decrement stock + increment soldCount
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        })
      }

      // 8. Create notification
      await tx.notification.create({
        data: {
          userId,
          type: 'ORDER_PLACED',
          title: 'Order Placed',
          message: `Your order ${orderNumber} has been placed successfully.`,
          metadata: { orderId: order.id, orderNumber },
        },
      })

      return order
    })
  }

  async getUserOrders(userId: string, page: number, limit: number, status?: string) {
    const where: { userId: string; status?: OrderStatus } = { userId }
    if (status) where.status = status as OrderStatus

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
          },
          payment: { select: { status: true, method: true } },
        },
      }),
    ])

    return { orders, meta: buildPaginationMeta(total, page, limit) }
  }

  async getOrderDetail(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
            vendor: { select: { storeName: true, storeSlug: true } },
          },
        },
        address: true,
        payment: true,
      },
    })
    if (!order) throw new Error('Order not found')
    return order
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } })
    if (!order) throw new Error('Order not found')
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new Error('Order cannot be cancelled at this stage')
    }

    return prisma.$transaction(async (tx) => {
      // Restore stock
      const items = await tx.orderItem.findMany({ where: { orderId } })
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        })
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      })
    })
  }

  // ─── Vendor order management ─────────────────────────────────────────────────

  async getVendorOrders(vendorId: string, page: number, limit: number, status?: string) {
    // Only show orders that have been paid (Order status = CONFIRMED)
    const where: any = {
      vendorId,
      order: { status: OrderStatus.CONFIRMED }
    }
    // Optionally filter by OrderItem status (PENDING, PROCESSING, SHIPPED, etc.)
    if (status) where.status = status as OrderStatus

    const [total, items] = await Promise.all([
      prisma.orderItem.count({ where }),
      prisma.orderItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: { address: true, user: { select: { firstName: true, lastName: true, email: true } } },
          },
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
        },
      }),
    ])

    return { items, meta: buildPaginationMeta(total, page, limit) }
  }

  async updateOrderItemStatus(itemId: string, vendorId: string, status: string) {
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED'],
      CONFIRMED: ['PROCESSING'],
      PROCESSING: ['SHIPPED'],
      SHIPPED: ['DELIVERED'],
    }

    const item = await prisma.orderItem.findFirst({ where: { id: itemId, vendorId } })
    if (!item) throw new Error('Order item not found')

    const allowed = validTransitions[item.status]
    if (!allowed || !allowed.includes(status)) {
      throw new Error(`Cannot transition from ${item.status} to ${status}`)
    }

    // Update item status
    const updated = await prisma.orderItem.update({ where: { id: itemId }, data: { status: status as any } })

    // Sync Order.status based on all its items
    const allItems = await prisma.orderItem.findMany({ where: { orderId: updated.orderId }, select: { status: true } })
    const statuses = allItems.map(i => i.status)
    const STATUS_RANK: Record<string, number> = { PENDING: 0, CONFIRMED: 1, PROCESSING: 2, SHIPPED: 3, DELIVERED: 4 }
    // Order takes the minimum rank across all items (slowest vendor determines overall state)
    const lowestStatus = statuses.reduce((min, s) =>
      (STATUS_RANK[s] ?? 0) < (STATUS_RANK[min] ?? 0) ? s : min
    )
    await prisma.order.update({ where: { id: updated.orderId }, data: { status: lowestStatus as any } })

    return updated
  }
}
