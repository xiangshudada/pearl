import Taro from '@tarojs/taro'

const TOKEN_KEY = 'pearl_token'

export function getToken(): string | null {
  try {
    return Taro.getStorageSync(TOKEN_KEY) || null
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    Taro.setStorageSync(TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

export function clearToken(): void {
  try {
    Taro.removeStorageSync(TOKEN_KEY)
  } catch {
    // ignore
  }
}
