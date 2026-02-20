import { z } from 'zod'

export const rejectVendorSchema = z.object({
  reason: z.string().optional(),
})

export type RejectVendorInput = z.infer<typeof rejectVendorSchema>
