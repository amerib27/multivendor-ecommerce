import { Response, NextFunction } from 'express'
import type { AuthRequest } from '../../middleware/auth.middleware'
import { NotificationsService } from './notifications.service'
import { sendSuccess } from '../../utils/apiResponse.utils'
import { buildPaginationMeta } from '../../utils/pagination.utils'

const notificationsService = new NotificationsService()

export const listNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const unreadOnly = req.query['unread'] === 'true'

    const { data, total } = await notificationsService.listNotifications(
      req.user!.userId,
      page,
      limit,
      unreadOnly
    )

    sendSuccess(res, data, 'Success', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await notificationsService.getUnreadCount(req.user!.userId)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await notificationsService.markAsRead(req.params['id'] as string, req.user!.userId)
    sendSuccess(res, null, 'Notification marked as read')
  } catch (err) {
    next(err)
  }
}

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await notificationsService.markAllAsRead(req.user!.userId)
    sendSuccess(res, null, 'All notifications marked as read')
  } catch (err) {
    next(err)
  }
}
