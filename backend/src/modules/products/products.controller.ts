import { Request, Response, NextFunction } from 'express'
import { ProductsService } from './products.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'
import type { AuthRequest } from '../../middleware/auth.middleware'
import { prisma } from '../../config/database'

const productsService = new ProductsService()

export const listProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { products, meta } = await productsService.listProducts(req.query as any)
    sendSuccess(res, products, 'Success', 200, meta)
  } catch (err) { next(err) }
}

export const getFeaturedProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query['limit'] as string) || 12
    const data = await productsService.getFeaturedProducts(limit)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await productsService.getProductBySlug(req.params['slug'] as string)
    // Get related products
    const categoryIds = product.categories.map(c => c.categoryId)
    const related = await productsService.getRelatedProducts(product.id, categoryIds)
    sendSuccess(res, { ...product, related })
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const getMyProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } })
    if (!vendor) { sendError(res, 'Vendor profile not found', 404); return }
    const page = parseInt(req.query['page'] as string) || 1
    const limit = parseInt(req.query['limit'] as string) || 20
    const { products, meta } = await productsService.getVendorProducts(vendor.id, page, limit)
    sendSuccess(res, products, 'Success', 200, meta)
  } catch (err) { next(err) }
}

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } })
    if (!vendor) { sendError(res, 'Vendor profile not found', 404); return }
    if (vendor.status !== 'ACTIVE') { sendError(res, 'Your store is not approved yet', 403); return }
    const data = await productsService.createProduct(vendor.id, req.body)
    sendSuccess(res, data, 'Product created', 201)
  } catch (err) { next(err) }
}

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } })
    if (!vendor) { sendError(res, 'Vendor profile not found', 404); return }
    const data = await productsService.updateProduct(req.params['id'] as string, vendor.id, req.body)
    sendSuccess(res, data, 'Product updated')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } })
    if (!vendor) { sendError(res, 'Vendor profile not found', 404); return }
    await productsService.deleteProduct(req.params['id'] as string, vendor.id)
    sendSuccess(res, null, 'Product deleted')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const uploadProductImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      sendError(res, 'No images uploaded', 400)
      return
    }
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } })
    if (!vendor) { sendError(res, 'Vendor not found', 404); return }
    const files = (req.files as (Express.Multer.File & { path: string; filename: string })[])
    const images = await productsService.addImages(req.params['id'] as string, vendor.id, files)
    sendSuccess(res, images, 'Images uploaded', 201)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const deleteProductImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } })
    if (!vendor) { sendError(res, 'Vendor not found', 404); return }
    await productsService.deleteImage(req.params['id'] as string, vendor.id, req.params['imageId'] as string)
    sendSuccess(res, null, 'Image deleted')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const setPrimaryImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } })
    if (!vendor) { sendError(res, 'Vendor not found', 404); return }
    const data = await productsService.setPrimaryImage(req.params['id'] as string, vendor.id, req.params['imageId'] as string)
    sendSuccess(res, data, 'Primary image set')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}
