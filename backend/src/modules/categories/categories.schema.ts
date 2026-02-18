import { z } from 'zod'

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).trim(),
    description: z.string().max(500).trim().optional(),
    parentId: z.string().optional().nullable(),
    sortOrder: z.number().int().min(0).optional().default(0),
  }),
})

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).trim().optional().nullable(),
    parentId: z.string().optional().nullable(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
})

export type CreateCategoryBody = z.infer<typeof createCategorySchema>['body']
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>['body']
