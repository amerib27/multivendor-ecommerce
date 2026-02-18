import { Request, Response, NextFunction } from 'express'
import { PaymentsService } from './payments.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import type { AuthRequest } from '../../middleware/auth.middleware'

const paymentsService = new PaymentsService()

export const createPaymentIntent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.body
    if (!orderId) { sendError(res, 'orderId is required', 400); return }
    const data = await paymentsService.createPaymentIntent(orderId, req.user!.userId)
    sendSuccess(res, data, 'Payment intent created')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
}

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string
    if (!signature) { sendError(res, 'Missing stripe-signature header', 400); return }
    const result = await paymentsService.handleWebhook(req.body as Buffer, signature)
    res.json(result)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
}

export const getPaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await paymentsService.getPaymentStatus(req.params['orderId'] as string, req.user!.userId)
    sendSuccess(res, data)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}
