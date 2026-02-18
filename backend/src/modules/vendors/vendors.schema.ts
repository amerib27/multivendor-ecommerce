import { z } from 'zod'

export const applyVendorSchema = z.object({
  body: z.object({
    storeName: z.string().min(3, 'Store name too short').max(100, 'Store name too long').trim(),
    description: z.string().max(1000).trim().optional(),
    email: z.string().email('Invalid email'),
    phone: z.string().max(20).optional(),
  }),
})

export const updateVendorSchema = z.object({
  body: z.object({
    description: z.string().max(1000).trim().optional(),
    phone: z.string().max(20).optional().nullable(),
  }),
})

export type ApplyVendorBody = z.infer<typeof applyVendorSchema>['body']
export type UpdateVendorBody = z.infer<typeof updateVendorSchema>['body']
