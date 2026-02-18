import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { cloudinary } from '../config/cloudinary'

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => ({
    folder: 'multivendor/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
    ],
  }),
})

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => ({
    folder: 'multivendor/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' },
    ],
  }),
})

const vendorLogoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => ({
    folder: 'multivendor/vendors/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
  }),
})

const vendorBannerStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => ({
    folder: 'multivendor/vendors/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 400, crop: 'fill', quality: 'auto' }],
  }),
})

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'))
  }
}

export const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB, max 5 files
  fileFilter,
})

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter,
})

export const uploadVendorLogo = multer({
  storage: vendorLogoStorage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter,
})

export const uploadVendorBanner = multer({
  storage: vendorBannerStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
})
