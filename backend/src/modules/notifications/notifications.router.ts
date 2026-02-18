import { Router } from 'express'
import { prisma } from '../../config/database'
import { sendSuccess } from '../../utils/apiResponse.utils'
import { authenticate } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../middleware/auth.middleware'
import { Response, NextFunction } from 'express'
import { buildPaginationMeta } from '../../utils/pagination.utils'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const unreadOnly = req.query['unread'] === 'true'

    const where = { userId: req.user!.userId, ...(unreadOnly && { isRead: false }) }
    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])
    sendSuccess(res, notifications, 'Success', 200, buildPaginationMeta(total, page, limit))
  } catch (err) { next(err) }
})

router.get('/unread-count', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    })
    sendSuccess(res, { count })
  } catch (err) { next(err) }
})

router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params['id'] as string, userId: req.user!.userId },
      data: { isRead: true },
    })
    sendSuccess(res, null, 'Notification marked as read')
  } catch (err) { next(err) }
})

router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    })
    sendSuccess(res, null, 'All notifications marked as read')
  } catch (err) { next(err) }
})

export default router
