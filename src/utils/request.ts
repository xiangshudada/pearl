import Taro from '@tarojs/taro'
import { getToken, clearToken } from './auth'

declare const API_BASE_URL: string

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: Record<string, unknown>
  headers?: Record<string, string>
  silent?: boolean  // 静默模式：不弹 Toast
  timeout?: number
}

interface ApiResponse<T = unknown> {
  data: T
  code?: number
  message?: string
}

export async function request<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', data, headers = {}, silent = false, timeout = 10000 } = options
  const token = getToken()

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`

  return new Promise((resolve, reject) => {
    Taro.request({
      url: fullUrl,
      method,
      data,
      header: requestHeaders,
      timeout,
      success(res) {
        if (res.statusCode === 401) {
          clearToken()
          Taro.switchTab({ url: '/pages/profile/index' })
          reject(new Error('未授权，请重新登录'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else {
          const errMsg = (res.data as ApiResponse)?.message || `请求失败 (${res.statusCode})`
          if (!silent) Taro.showToast({ title: errMsg, icon: 'none' })
          reject(new Error(errMsg))
        }
      },
      fail(err) {
        if (!silent) Taro.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
        reject(err)
      }
    })
  })
}

export const get = <T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  options?: Pick<RequestOptions, 'silent' | 'timeout'>
) => {
  let fullUrl = url
  if (params) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (query) fullUrl += `?${query}`
  }
  return request<T>(fullUrl, { method: 'GET', ...options })
}

export const post = <T = unknown>(url: string, data?: Record<string, unknown>) =>
  request<T>(url, { method: 'POST', data })

export const put = <T = unknown>(url: string, data?: Record<string, unknown>) =>
  request<T>(url, { method: 'PUT', data })

export const del = <T = unknown>(url: string) =>
  request<T>(url, { method: 'DELETE' })
