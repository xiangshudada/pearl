import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { login as apiLogin, getMe } from '@/api/auth'
import { getToken, setToken, clearToken } from '@/utils/auth'
import type { User } from '@/types'

interface UserStore {
  user: User | null
  token: string | null
  loading: boolean
  login: () => Promise<void>
  logout: () => void
  init: () => Promise<void>
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  token: null,
  loading: false,

  login: async () => {
    set({ loading: true })
    try {
      // Step 1: get wx code
      const code = await new Promise<string>((resolve, reject) => {
        Taro.login({
          success: (r) => resolve(r.code),
          fail: (e) => reject(e),
        })
      })

      // Step 2: exchange code for token
      const data = await apiLogin(code)
      const token = data.access_token
      setToken(token)
      set({ token, loading: false })

      // Step 3: fetch user info
      const user = await getMe()
      set({ user })

      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (err) {
      set({ loading: false })
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
      throw err
    }
  },

  logout: () => {
    clearToken()
    set({ user: null, token: null })
  },

  init: async () => {
    const token = getToken()
    if (!token) return

    set({ token })
    try {
      const user = await getMe(true)  // silent: 启动时静默验证，不弹错误提示
      set({ user })
    } catch {
      // Token invalid or expired, clear it silently
      clearToken()
      set({ user: null, token: null })
    }
  },
}))
