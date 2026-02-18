import slugify from 'slugify'
import { prisma } from '../../config/database'
import { buildPaginationMeta } from '../../utils/pagination.utils'
import type { ApplyVendorBody, UpdateVendorBody } from './vendors.schema'
import { Role } from '@prisma/client'

export class VendorsService {
  async apply(userId: string, data: ApplyVendorBody) {
    // Check if user already has a vendor profile
    const existing = await prisma.vendor.findUnique({ where: { userId } })
    if (existing) throw new Error('You already have a vendor application')

    // Generate unique store slug
    const storeSlug = await this.generateUniqueSlug(data.storeName)

    // Create vendor + update user role
    const vendor = await prisma.$transaction(async (tx) => {
      const v = await tx.vendor.create({
        data: {
          userId,
          storeName: data.storeName,
          storeSlug,
          description: data.description,
          email: data.email,
          phone: data.phone,
        },
      })
      await tx.user.update({ where: { id: userId }, data: { role: Role.VENDOR } })
      return v
    })

    return vendor
  }

  async getVendorProfile(userId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true, avatarUrl: true },
        },
        _count: { select: { products: true } },
      },
    })
    if (!vendor) throw new Error('Vendor profile not found')
    return vendor
  }

  async updateVendorProfile(userId: string, data: UpdateVendorBody) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } })
    if (!vendor) throw new Error('Vendor profile not found')

    return prisma.vendor.update({ where: { userId }, data })
  }

  async updateLogo(userId: string, logoUrl: string) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } })
    if (!vendor) throw new Error('Vendor profile not found')
    return prisma.vendor.update({ where: { userId }, data: { logoUrl } })
  }

  async updateBanner(userId: string, bannerUrl: string) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } })
    if (!vendor) throw new Error('Vendor profile not found')
    return prisma.vendor.update({ where: { userId }, data: { bannerUrl } })
  }

  async getPublicVendor(storeSlug: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { storeSlug, status: 'ACTIVE' },
      select: {
        id: true,
        storeName: true,
        storeSlug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        rating: true,
        reviewCount: true,
        totalOrders: true,
        createdAt: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
    })
    if (!vendor) throw new Error('Vendor store not found')
    return vendor
  }

  async getVendorProducts(storeSlug: string, page: number, limit: number) {
    const vendor = await prisma.vendor.findUnique({ where: { storeSlug, status: 'ACTIVE' } })
    if (!vendor) throw new Error('Vendor not found')

    const where = { vendorId: vendor.id, isActive: true }
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          categories: { include: { category: { select: { name: true, slug: true } } } },
          vendor: { select: { storeName: true, storeSlug: true } },
        },
      }),
    ])

    return { products, meta: buildPaginationMeta(total, page, limit) }
  }

  async getDashboardStats(userId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } })
    if (!vendor) throw new Error('Vendor profile not found')

    const [totalProducts, totalOrders] = await Promise.all([
      prisma.product.count({ where: { vendorId: vendor.id, isActive: true } }),
      prisma.orderItem.count({ where: { vendorId: vendor.id } }),
    ])

    const revenueAgg = await prisma.orderItem.aggregate({
      where: { vendorId: vendor.id },
      _sum: { vendorPayout: true },
    })

    return {
      totalRevenue: revenueAgg._sum.vendorPayout ?? 0,
      totalOrders,
      totalProducts,
      avgRating: vendor.rating ?? 0,
    }
  }

  async getDashboardAnalytics(userId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } })
    if (!vendor) throw new Error('Vendor profile not found')

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentItems = await prisma.orderItem.findMany({
      where: { vendorId: vendor.id, createdAt: { gte: thirtyDaysAgo } },
      select: { vendorPayout: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const byDay = new Map<string, number>()
    for (const item of recentItems) {
      const day = item.createdAt.toISOString().split('T')[0]!
      byDay.set(day, (byDay.get(day) ?? 0) + Number(item.vendorPayout ?? 0))
    }
    const revenueByDay = Array.from(byDay.entries()).map(([date, revenue]) => ({ date, revenue }))

    const topProducts = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: { soldCount: 'desc' },
      take: 5,
      select: { name: true, soldCount: true },
    })

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const monthAgg = await prisma.orderItem.aggregate({
      where: { vendorId: vendor.id, createdAt: { gte: monthStart } },
      _sum: { vendorPayout: true },
    })
    const totalAgg = await prisma.orderItem.aggregate({
      where: { vendorId: vendor.id },
      _sum: { vendorPayout: true },
      _count: true,
    })

    return {
      revenueByDay,
      topProducts: topProducts.map(p => ({ name: p.name, sales: p.soldCount })),
      totalRevenue: totalAgg._sum.vendorPayout ?? 0,
      monthRevenue: monthAgg._sum.vendorPayout ?? 0,
      totalSales: totalAgg._count,
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true })
    let slug = base
    let i = 1
    while (await prisma.vendor.findUnique({ where: { storeSlug: slug } })) {
      slug = `${base}-${i++}`
    }
    return slug
  }
}
