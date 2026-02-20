import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import * as notificationsController from './notifications.controller'

const router = Router()

router.use(authenticate)

router.get('/', notificationsController.listNotifications)
router.get('/unread-count', notificationsController.getUnreadCount)
router.patch('/:id/read', notificationsController.markAsRead)
router.patch('/read-all', notificationsController.markAllAsRead)

export default router
