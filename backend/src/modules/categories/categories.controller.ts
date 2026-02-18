import { Request, Response, NextFunction } from 'express'
import { CategoriesService } from './categories.service'
import { sendSuccess, sendError } from '../../utils/apiResponse.utils'

const categoriesService = new CategoriesService()

export const listCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const flat = req.query['flat'] === 'true'
    const data = await categoriesService.listCategories(flat)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await categoriesService.getCategoryBySlug(req.params['slug'] as string)
    sendSuccess(res, data)
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await categoriesService.createCategory(req.body)
    sendSuccess(res, data, 'Category created', 201)
  } catch (err) { next(err) }
}

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await categoriesService.updateCategory(req.params['id'] as string, req.body)
    sendSuccess(res, data, 'Category updated')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 404)
    else next(err)
  }
}

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await categoriesService.deleteCategory(req.params['id'] as string)
    sendSuccess(res, null, 'Category deleted')
  } catch (err) {
    if (err instanceof Error) sendError(res, err.message, 400)
    else next(err)
  }
}
