import apiClient from './client'

export interface Material {
  id: number
  category_id: number
  category_name?: string
  name: string
  size_mm: number
  price: number
  wuxing: '金' | '木' | '水' | '火' | '土' | null
  image_url: string
  stock: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface MaterialListParams {
  page?: number
  per_page?: number
  name?: string
  category_id?: number
  wuxing?: string
  is_active?: boolean | string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

export async function getMaterials(
  params?: MaterialListParams
): Promise<PaginatedResponse<Material>> {
  const res = await apiClient.get<PaginatedResponse<Material>>('/api/admin/materials', { params })
  return res.data
}

export async function createMaterial(data: Partial<Material>): Promise<Material> {
  const res = await apiClient.post<Material>('/api/admin/materials', data)
  return res.data
}

export async function updateMaterial(id: number, data: Partial<Material>): Promise<Material> {
  const res = await apiClient.put<Material>(`/api/admin/materials/${id}`, data)
  return res.data
}

export async function deleteMaterial(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/materials/${id}`)
}
