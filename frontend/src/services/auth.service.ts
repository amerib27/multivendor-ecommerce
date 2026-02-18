import api from './api'
import type { AuthUser } from '../store/auth.store'

interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export const authService = {
  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data)
    return res.data.data
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', data)
    return res.data.data
  },

  async logout() {
    await api.post('/auth/logout').catch(() => {}) // Ignore errors on logout
  },

  async getMe() {
    const res = await api.get<{ success: boolean; data: AuthUser }>('/auth/me')
    return res.data.data
  },
}
