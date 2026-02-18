export interface IProductImage {
  id: string
  url: string
  altText?: string | null
  isPrimary: boolean
  sortOrder: number
}

export interface IProductCategory {
  id: string
  name: string
  slug: string
}

export interface IProduct {
  id: string
  vendorId: string
  name: string
  slug: string
  description: string
  price: number
  comparePrice?: number | null
  sku?: string | null
  stock: number
  isActive: boolean
  isFeatured: boolean
  rating: number
  reviewCount: number
  soldCount: number
  images: IProductImage[]
  categories: IProductCategory[]
  createdAt: Date
  updatedAt: Date
}

export interface IProductListItem {
  id: string
  slug: string
  name: string
  price: number
  comparePrice?: number | null
  rating: number
  reviewCount: number
  soldCount: number
  images: IProductImage[]
  vendor: {
    storeName: string
    storeSlug: string
  }
}
