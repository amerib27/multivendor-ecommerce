export type VendorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'

export interface IVendor {
  id: string
  userId: string
  storeName: string
  storeSlug: string
  description?: string | null
  logoUrl?: string | null
  bannerUrl?: string | null
  email: string
  phone?: string | null
  status: VendorStatus
  commissionRate: number
  totalRevenue: number
  totalOrders: number
  rating: number
  reviewCount: number
  createdAt: Date
  updatedAt: Date
}

export interface IVendorPublic {
  id: string
  storeName: string
  storeSlug: string
  description?: string | null
  logoUrl?: string | null
  bannerUrl?: string | null
  rating: number
  reviewCount: number
  totalOrders: number
}
