import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    firstName: z.string().min(2, 'First name too short').max(50, 'First name too long').trim(),
    lastName: z.string().min(2, 'Last name too short').max(50, 'Last name too long').trim(),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
})

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
})

export type RegisterBody = z.infer<typeof registerSchema>['body']
export type LoginBody = z.infer<typeof loginSchema>['body']
export type RefreshBody = z.infer<typeof refreshSchema>['body']
