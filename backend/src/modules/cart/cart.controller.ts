import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { CartService } from './cart.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import type { AuthRequest } from '../../middleware/auth.middleware'

const cartService = new CartService()

export const getCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cartService.getCart(req.user!.userId)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

export const addItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, quantity = 1 } = req.body
    if (!productId) { sendError(res, 'productId is required', 400); return }
    const data = await cartService.addItem(req.user!.userId, productId, Math.max(1, quantity))
    sendSuccess(res, data, 'Item added to cart')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
}

export const updateItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quantity } = req.body
    if (quantity === undefined) { sendError(res, 'quantity is required', 400); return }
    const data = await cartService.updateItem(req.user!.userId, req.params['itemId'] as string, quantity)
    sendSuccess(res, data, 'Cart updated')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
}

export const removeItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cartService.removeItem(req.user!.userId, req.params['itemId'] as string)
    sendSuccess(res, data, 'Item removed')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await cartService.clearCart(req.user!.userId)
    sendSuccess(res, null, 'Cart cleared')
  } catch (err) { next(err) }
}
