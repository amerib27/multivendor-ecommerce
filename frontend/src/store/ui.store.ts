import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

interface UIState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  toast: (message: string, type: Toast['type']) => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    const duration = toast.duration ?? 4000
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, duration)
  },

  toast: (message, type) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 4000)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),
}))

// Convenience helpers
export const toast = {
  success: (message: string) => useUIStore.getState().addToast({ type: 'success', message }),
  error: (message: string) => useUIStore.getState().addToast({ type: 'error', message }),
  info: (message: string) => useUIStore.getState().addToast({ type: 'info', message }),
  warning: (message: string) => useUIStore.getState().addToast({ type: 'warning', message }),
}
