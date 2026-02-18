import { Router } from 'express'
import { prisma } from '../../config/database'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import { authenticate } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../middleware/auth.middleware'
import { Request, Response, NextFunction } from 'express'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const wishlist = await prisma.wishlist.upsert({
      where: { userId: req.user!.userId },
      create: { userId: req.user!.userId },
      update: {},
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                vendor: { select: { storeName: true, storeSlug: true } },
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    })
    sendSuccess(res, wishlist)
  } catch (err) { next(err) }
})

router.post('/:productId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params['productId'] as string } })
    if (!product) { sendError(res, 'Product not found', 404); return }

    let wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user!.userId } })
    if (!wishlist) wishlist = await prisma.wishlist.create({ data: { userId: req.user!.userId } })

    await prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId: req.params['productId'] as string } },
      update: {},
      create: { wishlistId: wishlist.id, productId: req.params['productId'] as string },
    })
    sendSuccess(res, null, 'Added to wishlist')
  } catch (err) { next(err) }
})

router.delete('/:productId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user!.userId } })
    if (!wishlist) { sendSuccess(res, null, 'Removed'); return }
    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId: req.params['productId'] as string },
    })
    sendSuccess(res, null, 'Removed from wishlist')
  } catch (err) { next(err) }
})

export default router
