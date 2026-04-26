import { create } from 'zustand'
import { adminLogin } from '@/api/auth'

interface AuthState {
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('admin_token'),

  login: async (username: string, password: string) => {
    const res = await adminLogin(username, password)
    localStorage.setItem('admin_token', res.access_token)
    set({ token: res.access_token })
  },

  logout: () => {
    localStorage.removeItem('admin_token')
    set({ token: null })
  },
}))
