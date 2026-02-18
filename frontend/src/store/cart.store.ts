import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number
  comparePrice?: number | null
  quantity: number
  imageUrl: string
  vendorName: string
  vendorSlug: string
  stock: number
}

interface CartState {
  items: CartItem[]
  itemCount: number
  total: number
  isOpen: boolean

  addItem: (item: CartItem) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const calcTotals = (items: CartItem[]) => ({
  itemCount: items.reduce((s, i) => s + i.quantity, 0),
  total: items.reduce((s, i) => s + i.price * i.quantity, 0),
})

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      total: 0,
      isOpen: false,

      addItem: (item) => {
        const existing = get().items.find(i => i.productId === item.productId)
        let items: CartItem[]
        if (existing) {
          const newQty = Math.min(existing.quantity + item.quantity, item.stock)
          items = get().items.map(i =>
            i.productId === item.productId ? { ...i, quantity: newQty } : i
          )
        } else {
          items = [...get().items, { ...item, quantity: Math.min(item.quantity, item.stock) }]
        }
        set({ items, ...calcTotals(items) })
      },

      updateQuantity: (productId, quantity) => {
        const items = quantity <= 0
          ? get().items.filter(i => i.productId !== productId)
          : get().items.map(i => {
              if (i.productId !== productId) return i
              return { ...i, quantity: Math.min(quantity, i.stock) }
            })
        set({ items, ...calcTotals(items) })
      },

      removeItem: (productId) => {
        const items = get().items.filter(i => i.productId !== productId)
        set({ items, ...calcTotals(items) })
      },

      clearCart: () => set({ items: [], itemCount: 0, total: 0 }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items, itemCount: state.itemCount, total: state.total }),
    }
  )
)
