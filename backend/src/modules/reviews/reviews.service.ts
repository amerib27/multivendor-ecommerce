import { prisma } from '../../config/database'
import { buildPaginationMeta } from '../../utils/pagination.utils'

export class ReviewsService {
  async getProductReviews(productId: string, page: number, limit: number) {
    const [total, reviews] = await Promise.all([
      prisma.review.count({ where: { productId, isVisible: true } }),
      prisma.review.findMany({
        where: { productId, isVisible: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
    ])
    return { reviews, meta: buildPaginationMeta(total, page, limit) }
  }

  async createReview(userId: string, productId: string, data: {
    rating: number
    title?: string
    body?: string
  }) {
    if (data.rating < 1 || data.rating > 5) throw new Error('Rating must be between 1 and 5')

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Product not found')

    // Check if user purchased this product (for verified badge)
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: { in: ['DELIVERED', 'CONFIRMED'] } },
      },
    })

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: data.rating,
        title: data.title,
        body: data.body,
        isVerified: !!purchased,
      },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    })

    // Update product rating
    await this.updateProductRating(productId)

    return review
  }

  async updateReview(reviewId: string, userId: string, data: { rating?: number; title?: string; body?: string }) {
    const review = await prisma.review.findFirst({ where: { id: reviewId, userId } })
    if (!review) throw new Error('Review not found')

    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5')
    }

    const updated = await prisma.review.update({ where: { id: reviewId }, data })
    await this.updateProductRating(review.productId)
    return updated
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await prisma.review.findFirst({ where: { id: reviewId, userId } })
    if (!review) throw new Error('Review not found')
    await prisma.review.delete({ where: { id: reviewId } })
    await this.updateProductRating(review.productId)
  }

  private async updateProductRating(productId: string) {
    const result = await prisma.review.aggregate({
      where: { productId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    })
    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: result._avg.rating || 0,
        reviewCount: result._count.rating,
      },
    })
  }
}
