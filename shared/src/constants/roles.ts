export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
