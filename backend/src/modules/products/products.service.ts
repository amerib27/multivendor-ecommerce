import slugify from 'slugify'
import { prisma } from '../../config/database'
import { cloudinary } from '../../config/cloudinary'
import { buildPaginationMeta } from '../../utils/pagination.utils'
import { Prisma } from '@prisma/client'
import type { CreateProductBody, UpdateProductBody, ProductQuery } from './products.schema'

// Reusable product select for list views
const productListSelect = {
  id: true,
  slug: true,
  name: true,
  price: true,
  comparePrice: true,
  rating: true,
  reviewCount: true,
  soldCount: true,
  stock: true,
  isActive: true,
  isFeatured: true,
  createdAt: true,
  images: { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
  vendor: { select: { storeName: true, storeSlug: true, rating: true, status: true } },
  categories: { include: { category: { select: { name: true, slug: true } } } },
}

export class ProductsService {
  async listProducts(query: ProductQuery) {
    const page = Math.max(1, parseInt(query.page))
    const limit = Math.min(100, Math.max(1, parseInt(query.limit)))

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      vendor: { status: 'ACTIVE' },
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.category) {
      where.categories = { some: { category: { slug: query.category } } }
    }

    if (query.vendor) {
      where.vendor = { ...(where.vendor as object), storeSlug: query.vendor }
    }

    if (query.featured === 'true') {
      where.isFeatured = true
    }

    if (query.minPrice || query.maxPrice) {
      where.price = {}
      if (query.minPrice) (where.price as Prisma.DecimalFilter).gte = parseFloat(query.minPrice)
      if (query.maxPrice) (where.price as Prisma.DecimalFilter).lte = parseFloat(query.maxPrice)
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc' ? { price: 'asc' } :
      query.sort === 'price_desc' ? { price: 'desc' } :
      query.sort === 'rating' ? { rating: 'desc' } :
      query.sort === 'popular' ? { soldCount: 'desc' } :
      { createdAt: 'desc' }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: productListSelect,
      }),
    ])

    return { products, meta: buildPaginationMeta(total, page, limit) }
  }

  async getProductBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true, vendor: { status: 'ACTIVE' } },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        vendor: {
          select: {
            id: true,
            storeName: true,
            storeSlug: true,
            logoUrl: true,
            rating: true,
            reviewCount: true,
          },
        },
        categories: { include: { category: true } },
        reviews: {
          where: { isVisible: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
    })
    if (!product) throw new Error('Product not found')
    return product
  }

  async getFeaturedProducts(limit = 12) {
    return prisma.product.findMany({
      where: { isActive: true, isFeatured: true, vendor: { status: 'ACTIVE' } },
      take: limit,
      orderBy: { soldCount: 'desc' },
      select: productListSelect,
    })
  }

  async getRelatedProducts(productId: string, categoryIds: string[], limit = 6) {
    return prisma.product.findMany({
      where: {
        id: { not: productId },
        isActive: true,
        vendor: { status: 'ACTIVE' },
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      take: limit,
      orderBy: { rating: 'desc' },
      select: productListSelect,
    })
  }

  // ─── Vendor product management ────────────────────────────────────────────────

  async getVendorProducts(vendorId: string, page: number, limit: number) {
    const where = { vendorId }
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          categories: { include: { category: { select: { name: true } } } },
          _count: { select: { reviews: true, orderItems: true } },
        },
      }),
    ])
    return { products, meta: buildPaginationMeta(total, page, limit) }
  }

  async createProduct(vendorId: string, data: CreateProductBody) {
    const { categoryIds, ...productData } = data
    const slug = await this.generateUniqueSlug(data.name)

    return prisma.product.create({
      data: {
        ...productData,
        slug,
        vendorId,
        categories: {
          create: categoryIds.map(categoryId => ({ categoryId })),
        },
      },
      include: {
        images: true,
        categories: { include: { category: true } },
      },
    })
  }

  async updateProduct(productId: string, vendorId: string, data: UpdateProductBody) {
    const product = await prisma.product.findFirst({ where: { id: productId, vendorId } })
    if (!product) throw new Error('Product not found')

    const { categoryIds, ...updateData } = data
    const finalData: typeof updateData & { slug?: string } = { ...updateData }

    if (data.name && data.name !== product.name) {
      finalData.slug = await this.generateUniqueSlug(data.name, productId)
    }

    // Update categories if provided
    if (categoryIds) {
      await prisma.productCategory.deleteMany({ where: { productId } })
      await prisma.productCategory.createMany({
        data: categoryIds.map(categoryId => ({ productId, categoryId })),
      })
    }

    return prisma.product.update({
      where: { id: productId },
      data: finalData,
      include: {
        images: true,
        categories: { include: { category: true } },
      },
    })
  }

  async deleteProduct(productId: string, vendorId: string) {
    const product = await prisma.product.findFirst({ where: { id: productId, vendorId } })
    if (!product) throw new Error('Product not found')

    // Delete all Cloudinary images
    const images = await prisma.productImage.findMany({ where: { productId } })
    await Promise.all(images.map(img => cloudinary.uploader.destroy(img.publicId).catch(console.error)))

    await prisma.product.delete({ where: { id: productId } })
  }

  // ─── Image management ─────────────────────────────────────────────────────────

  async addImages(
    productId: string,
    vendorId: string,
    files: Array<{ path: string; filename: string }>
  ) {
    const product = await prisma.product.findFirst({ where: { id: productId, vendorId } })
    if (!product) throw new Error('Product not found')

    const existingCount = await prisma.productImage.count({ where: { productId } })
    const hasPrimary = await prisma.productImage.findFirst({ where: { productId, isPrimary: true } })

    const images = await prisma.productImage.createMany({
      data: files.map((file, index) => ({
        productId,
        url: file.path,
        publicId: file.filename,
        sortOrder: existingCount + index,
        isPrimary: !hasPrimary && index === 0,
      })),
    })

    return prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: 'asc' } })
  }

  async deleteImage(productId: string, vendorId: string, imageId: string) {
    const product = await prisma.product.findFirst({ where: { id: productId, vendorId } })
    if (!product) throw new Error('Product not found')

    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } })
    if (!image) throw new Error('Image not found')

    await cloudinary.uploader.destroy(image.publicId).catch(console.error)
    await prisma.productImage.delete({ where: { id: imageId } })

    // If deleted image was primary, set first remaining as primary
    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      })
      if (next) {
        await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } })
      }
    }
  }

  async setPrimaryImage(productId: string, vendorId: string, imageId: string) {
    const product = await prisma.product.findFirst({ where: { id: productId, vendorId } })
    if (!product) throw new Error('Product not found')

    await prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } })
    return prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } })
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true })
    let slug = base
    let i = 1
    while (true) {
      const existing = await prisma.product.findUnique({ where: { slug } })
      if (!existing || existing.id === excludeId) break
      slug = `${base}-${i++}`
    }
    return slug
  }
}
