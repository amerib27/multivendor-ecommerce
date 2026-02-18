import { z } from 'zod'

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name too short').max(200, 'Name too long').trim(),
    description: z.string().min(10, 'Description too short').max(5000),
    price: z.number().positive('Price must be positive'),
    comparePrice: z.number().positive().optional().nullable(),
    costPrice: z.number().positive().optional().nullable(),
    sku: z.string().max(100).trim().optional().nullable(),
    stock: z.number().int().min(0).default(0),
    lowStockThreshold: z.number().int().min(0).default(5),
    weight: z.number().positive().optional().nullable(),
    categoryIds: z.array(z.string()).min(1, 'At least one category required'),
    isFeatured: z.boolean().optional().default(false),
  }),
})

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(200).trim().optional(),
    description: z.string().min(10).max(5000).optional(),
    price: z.number().positive().optional(),
    comparePrice: z.number().positive().optional().nullable(),
    costPrice: z.number().positive().optional().nullable(),
    sku: z.string().max(100).trim().optional().nullable(),
    stock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    weight: z.number().positive().optional().nullable(),
    categoryIds: z.array(z.string()).min(1).optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
})

export const productQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    category: z.string().optional(),
    vendor: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).optional().default('newest'),
    search: z.string().optional(),
    featured: z.string().optional(),
  }),
})

export type CreateProductBody = z.infer<typeof createProductSchema>['body']
export type UpdateProductBody = z.infer<typeof updateProductSchema>['body']
export type ProductQuery = z.infer<typeof productQuerySchema>['query']
