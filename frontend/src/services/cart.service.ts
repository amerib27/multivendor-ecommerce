import api from './api'

export const cartService = {
  async get() {
    const res = await api.get('/cart')
    return res.data.data
  },

  async addItem(productId: string, quantity = 1) {
    const res = await api.post('/cart/items', { productId, quantity })
    return res.data.data
  },

  async updateItem(itemId: string, quantity: number) {
    const res = await api.put(`/cart/items/${itemId}`, { quantity })
    return res.data.data
  },

  async removeItem(itemId: string) {
    const res = await api.delete(`/cart/items/${itemId}`)
    return res.data.data
  },

  async clear() {
    await api.delete('/cart')
  },
}
