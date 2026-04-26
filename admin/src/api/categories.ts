import apiClient from './client'

export interface Category {
  id: number
  parent_id: number | null
  name: string
  sort_order: number
  created_at: string
  children?: Category[]
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get<Category[]>('/api/admin/categories')
  return res.data
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  const res = await apiClient.post<Category>('/api/admin/categories', data)
  return res.data
}

export async function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  const res = await apiClient.put<Category>(`/api/admin/categories/${id}`, data)
  return res.data
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/categories/${id}`)
}
