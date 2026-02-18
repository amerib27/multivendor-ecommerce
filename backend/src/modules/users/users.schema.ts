import { z } from 'zod'

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(50).trim().optional(),
    lastName: z.string().min(2).max(50).trim().optional(),
    phone: z.string().max(20).optional().nullable(),
  }),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  }),
})

export const createAddressSchema = z.object({
  body: z.object({
    label: z.string().max(50).optional().default('Home'),
    fullName: z.string().min(2).max(100).trim(),
    phone: z.string().min(7).max(20),
    line1: z.string().min(5).max(200).trim(),
    line2: z.string().max(200).trim().optional(),
    city: z.string().min(2).max(100).trim(),
    state: z.string().min(2).max(100).trim(),
    postalCode: z.string().min(3).max(20).trim(),
    country: z.string().length(2).default('US'),
    isDefault: z.boolean().optional().default(false),
  }),
})

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>['body']
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>['body']
export type CreateAddressBody = z.infer<typeof createAddressSchema>['body']
