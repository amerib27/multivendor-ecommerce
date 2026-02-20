import { z } from 'zod'

export const listNotificationsSchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  unread: z.enum(['true', 'false']).optional(),
})

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>
