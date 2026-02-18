import { Router } from 'express'
import {
  getProfile, updateProfile, updateAvatar, changePassword,
  getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
} from './users.controller'
import { authenticate } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { uploadAvatar } from '../../middleware/upload.middleware'
import { updateProfileSchema, changePasswordSchema, createAddressSchema } from './users.schema'

const router = Router()

// All user routes require authentication
router.use(authenticate)

router.get('/profile', getProfile)
router.put('/profile', validate(updateProfileSchema), updateProfile)
router.post('/avatar', uploadAvatar.single('avatar'), updateAvatar)
router.put('/password', validate(changePasswordSchema), changePassword)

// Addresses
router.get('/addresses', getAddresses)
router.post('/addresses', validate(createAddressSchema), createAddress)
router.put('/addresses/:id', updateAddress)
router.delete('/addresses/:id', deleteAddress)
router.patch('/addresses/:id/default', setDefaultAddress)

export default router
