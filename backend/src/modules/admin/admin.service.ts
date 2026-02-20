import { prisma } from '../../config/database'
import { sendVendorApprovalEmail, sendVendorRejectionEmail } from '../../utils/email.utils'
import { OrderStatus } from '@prisma/client'

export class AdminService {
  // ─── Users ─────────────────────────────────────────────────────────────────
  async listUsers(page: number, limit: number, search?: string) {
    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, isEmailVerified: true, createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ])
    return { data: users, total }
  }

  async toggleUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    })
    return { id: updated.id, isActive: updated.isActive, message: `User ${updated.isActive ? 'activated' : 'deactivated'}` }
  }

  // ─── Vendors ───────────────────────────────────────────────────────────────
  async listVendors(page: number, limit: number, status?: string) {
    const where = status ? { status: status as any } : {}

    const [total, vendors] = await Promise.all([
      prisma.vendor.count({ where }),
      prisma.vendor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          _count: { select: { products: true, orderItems: true } },
        },
      }),
    ])
    return { data: vendors, total }
  }

  async approveVendor(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true },
    })
    if (!vendor) throw new Error('Vendor not found')

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'ACTIVE' },
    })

    // Send email
    sendVendorApprovalEmail(vendor.user.email, {
      storeName: vendor.storeName,
      firstName: vendor.user.firstName,
    }).catch(console.error)

    // Create notification
    await prisma.notification.create({
      data: {
        userId: vendor.userId,
        type: 'VENDOR_APPROVED',
        title: 'Store Approved!',
        message: `Your store "${vendor.storeName}" has been approved.`,
      },
    })

    return updated
  }

  async rejectVendor(vendorId: string, reason?: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true },
    })
    if (!vendor) throw new Error('Vendor not found')

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'REJECTED' },
    })

    // Send email
    sendVendorRejectionEmail(vendor.user.email, {
      storeName: vendor.storeName,
      firstName: vendor.user.firstName,
      reason,
    }).catch(console.error)

    // Create notification
    await prisma.notification.create({
      data: {
        userId: vendor.userId,
        type: 'VENDOR_REJECTED',
        title: 'Application Update',
        message: `Your store "${vendor.storeName}" application was not approved.`,
      },
    })

    return updated
  }

  async suspendVendor(vendorId: string) {
    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'SUSPENDED' },
    })
    return updated
  }

  // ─── Products ──────────────────────────────────────────────────────────────
  async listProducts(page: number, limit: number) {
    const [total, products] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          vendor: { select: { storeName: true } },
          _count: { select: { reviews: true, orderItems: true } },
        },
      }),
    ])
    return { data: products, total }
  }

  async toggleProduct(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Product not found')

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isActive: !product.isActive },
    })
    return { id: updated.id, isActive: updated.isActive, message: `Product ${updated.isActive ? 'activated' : 'deactivated'}` }
  }

  async toggleProductFeatured(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Product not found')

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isFeatured: !product.isFeatured },
    })
    return { id: updated.id, isFeatured: updated.isFeatured }
  }

  // ─── Orders ────────────────────────────────────────────────────────────────
  async listOrders(page: number, limit: number, status?: string) {
    const where = status ? { status: status as any } : {}

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          payment: { select: { status: true, method: true } },
          _count: { select: { items: true } },
        },
      }),
    ])
    return { data: orders, total }
  }

  async resyncOrderStatuses() {
    const orders = await prisma.order.findMany({
      where: { status: { notIn: [OrderStatus.CANCELLED] } },
      include: { items: { select: { status: true } } },
    })

    const STATUS_RANK: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 1,
      PROCESSING: 2,
      SHIPPED: 3,
      DELIVERED: 4,
    }

    let synced = 0
    for (const order of orders) {
      if (!order.items.length) continue

      const lowestStatus = order.items
        .map(i => i.status)
        .reduce((min, s) =>
          (STATUS_RANK[s] ?? 0) < (STATUS_RANK[min] ?? 0) ? s : min
        )

      if (order.status !== lowestStatus) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: lowestStatus as any },
        })
        synced++
      }
    }

    return { synced }
  }
}
