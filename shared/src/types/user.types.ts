export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN'

export interface IUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  avatarUrl?: string | null
  role: UserRole
  isEmailVerified: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IUserPublic {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  role: UserRole
}
