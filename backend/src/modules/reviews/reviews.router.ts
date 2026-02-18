import { Router } from 'express'
import { ReviewsService } from './reviews.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import { authenticate } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../middleware/auth.middleware'
import { Request, Response, NextFunction } from 'express'

const reviewsService = new ReviewsService()
const router = Router()

router.get('/product/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 10
    const { reviews, meta } = await reviewsService.getProductReviews(req.params['productId'] as string, page, limit)
    sendSuccess(res, reviews, 'Success', 200, meta)
  } catch (err) { next(err) }
})

router.post('/product/:productId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rating, title, body } = req.body
    if (!rating) { sendError(res, 'Rating is required', 400); return }
    const review = await reviewsService.createReview(req.user!.userId, req.params['productId'] as string, { rating, title, body })
    sendSuccess(res, review, 'Review submitted', 201)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
})

router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await reviewsService.updateReview(req.params['id'] as string, req.user!.userId, req.body)
    sendSuccess(res, review, 'Review updated')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
})

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await reviewsService.deleteReview(req.params['id'] as string, req.user!.userId)
    sendSuccess(res, null, 'Review deleted')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
})

export default router
