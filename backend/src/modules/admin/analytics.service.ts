import { prisma } from '../../config/database'

export class AnalyticsService {
  async getPlatformStats() {
    const [totalUsers, totalVendors, totalProducts, totalOrders, revenueData, pendingVendors] =
      await Promise.all([
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.vendor.count({ where: { status: 'ACTIVE' } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.order.count(),
        prisma.payment.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true },
        }),
        prisma.vendor.count({ where: { status: 'PENDING' } }),
      ])

    return {
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      totalRevenue: Number(revenueData._sum.amount) || 0,
      pendingVendors,
    }
  }

  async getRevenueByPeriod(period: 'week' | 'month' | 'year') {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Using Prisma's groupBy for portable SQL
    const payments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date in application layer
    const grouped = payments.reduce<Record<string, { revenue: number; count: number }>>(
      (acc, p) => {
        const date = p.createdAt.toISOString().slice(0, 10)
        if (!acc[date]) acc[date] = { revenue: 0, count: 0 }
        acc[date]!.revenue += Number(p.amount)
        acc[date]!.count++
        return acc
      },
      {}
    )

    return Object.entries(grouped).map(([date, data]) => ({ date, ...data }))
  }

  async getTopProducts(limit = 10) {
    return prisma.product.findMany({
      where: { isActive: true },
      orderBy: { soldCount: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        soldCount: true,
        price: true,
        rating: true,
        images: { where: { isPrimary: true }, take: 1 },
        vendor: { select: { storeName: true } },
      },
    })
  }

  async getTopVendors(limit = 10) {
    return prisma.vendor.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { totalRevenue: 'desc' },
      take: limit,
      select: {
        id: true,
        storeName: true,
        storeSlug: true,
        totalRevenue: true,
        totalOrders: true,
        rating: true,
        logoUrl: true,
      },
    })
  }

  async getRecentOrders(limit = 10) {
    return prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        payment: { select: { status: true } },
        _count: { select: { items: true } },
      },
    })
  }
}
