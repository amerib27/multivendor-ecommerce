export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'STRIPE' | 'COD'

export interface IOrderItem {
  id: string
  productId: string
  vendorId: string
  productName: string
  productImage?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  status: OrderStatus
}

export interface IOrder {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  notes?: string | null
  items: IOrderItem[]
  createdAt: Date
  updatedAt: Date
}
