import { post, get } from '@/utils/request'
import type { User } from '@/types'

interface LoginResponse {
  access_token: string
  token_type?: string
}

export function login(code: string): Promise<LoginResponse> {
  return post<LoginResponse>('/api/auth/login', { code })
}

export function getMe(silent = false): Promise<User> {
  return get<User>('/api/auth/me', undefined, { silent })
}
