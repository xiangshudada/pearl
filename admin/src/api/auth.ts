import apiClient from './client'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/api/admin/login', { username, password })
  return res.data
}
