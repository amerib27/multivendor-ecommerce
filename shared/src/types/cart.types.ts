export interface ICartItem {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    comparePrice?: number | null
    stock: number
    images: { url: string; isPrimary: boolean }[]
    vendor: { storeName: string; storeSlug: string }
  }
}

export interface ICart {
  id: string
  userId: string
  items: ICartItem[]
  updatedAt: Date
}
