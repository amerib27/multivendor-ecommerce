import { Router } from 'express'
import { getCart, addItem, updateItem, removeItem, clearCart } from './cart.controller'
import { authenticate } from '../../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getCart)
router.post('/items', addItem)
router.put('/items/:itemId', updateItem)
router.delete('/items/:itemId', removeItem)
router.delete('/', clearCart)

export default router
