import api from './api'

export const vendorsService = {
  async apply(data: { storeName: string; description?: string; email: string; phone?: string }) {
    const res = await api.post('/vendors/apply', data)
    return res.data.data
  },

  async getProfile() {
    const res = await api.get('/vendors/dashboard/profile')
    return res.data.data
  },

  async updateProfile(data: { description?: string; phone?: string }) {
    const res = await api.put('/vendors/dashboard/profile', data)
    return res.data.data
  },

  async getPublicStore(slug: string) {
    const res = await api.get(`/vendors/${slug}`)
    return res.data.data
  },

  async getStoreProducts(slug: string, params: { page?: number; limit?: number } = {}) {
    const res = await api.get(`/vendors/${slug}/products`, { params })
    return res.data
  },
}
