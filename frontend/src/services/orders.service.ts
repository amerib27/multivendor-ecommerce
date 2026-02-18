import api from './api'

export const ordersService = {
  async create(data: { addressId: string; notes?: string }) {
    const res = await api.post('/orders', data)
    return res.data.data
  },

  async list(params: { page?: number; limit?: number; status?: string } = {}) {
    const res = await api.get('/orders', { params })
    return res.data
  },

  async getById(id: string) {
    const res = await api.get(`/orders/${id}`)
    return res.data.data
  },

  async cancel(id: string) {
    const res = await api.patch(`/orders/${id}/cancel`)
    return res.data.data
  },

  // Vendor methods
  async getVendorOrders(params: { page?: number; limit?: number; status?: string } = {}) {
    const res = await api.get('/orders/vendor/incoming', { params })
    return res.data
  },

  async updateItemStatus(itemId: string, status: string) {
    const res = await api.patch(`/orders/vendor/items/${itemId}/status`, { status })
    return res.data.data
  },

  // Admin methods
  async adminList(params: { page?: number; limit?: number; status?: string } = {}) {
    const res = await api.get('/admin/orders', { params })
    return res.data
  },
}
