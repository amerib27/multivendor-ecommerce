import api from './api'

export interface ProductFilters {
  page?: number
  limit?: number
  category?: string
  vendor?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular'
  search?: string
  featured?: boolean
}

export const productsService = {
  async list(filters: ProductFilters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    const res = await api.get(`/products?${params}`)
    return res.data
  },

  async getFeatured(limit = 12) {
    const res = await api.get(`/products/featured?limit=${limit}`)
    return res.data.data
  },

  async getBySlug(slug: string) {
    const res = await api.get(`/products/${slug}`)
    return res.data.data
  },

  // Vendor methods
  async getMyProducts(params: { page?: number; limit?: number } = {}) {
    const res = await api.get('/products/vendor/mine', { params })
    return res.data
  },

  async create(data: FormData | object) {
    const isFormData = data instanceof FormData
    const res = await api.post('/products', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    })
    return res.data.data
  },

  async update(id: string, data: object) {
    const res = await api.put(`/products/${id}`, data)
    return res.data.data
  },

  async delete(id: string) {
    await api.delete(`/products/${id}`)
  },

  async uploadImages(productId: string, files: FileList | File[]) {
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('images', f))
    const res = await api.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  async deleteImage(productId: string, imageId: string) {
    await api.delete(`/products/${productId}/images/${imageId}`)
  },
}
